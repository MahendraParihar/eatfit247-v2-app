-- =============================================================================
-- 146_configurable_tax_treatment.sql
-- Configurable tax treatment (roadmap 4.14), plan groups 1 and 1b — spec:
-- specs/features/2026-10-25-configurable-tax-treatment/requirements.md
-- =============================================================================
--   1. mst_franchise_tax_registrations (decision 8)
--      One row per franchise × country × tax system: number, GST State, IEC,
--      working currency, effective dates, and (for a registration abroad) its own
--      invoice prefix, number format and FY start. "Unregistered" means no active
--      row. The old mst_franchises.gst_number / vat_number columns stay and are
--      kept in sync for one release (group 4).
--
--   2. mst_franchises.currency_code (decision 17)
--      The franchise's working currency, from its address country.
--
--   3. Registrations back-filled from the franchise (address = txn_addresses
--      table_id 4), numbers stripped of spaces and punctuation: gst_number → GST
--      only when the address country is IN (State = the GSTIN's first two
--      digits); vat_number → VAT in the address country. An inactive franchise
--      gets an inactive registration. Skipped with a NOTICE: a GSTIN on a
--      non-Indian franchise, a malformed GSTIN on an inactive one.
--      ABORTS, before any change, when:
--        - two active franchises hold the same number (e.g. a copied GSTIN)
--        - an active Indian franchise's GSTIN is not 15 characters starting with
--          the State code (today it charges GST; dropping it would make it
--          unregistered)
--        - two active Tax Master rules collide on the new rule key (the old key
--          allowed them when only tax_code differed)
--      Fix the franchise form / Tax Master first.
--
--   4. mst_tax_master: treatment rules (decisions 3, 4, 7)
--      Conditions (customer scope, specific place-of-supply country, State
--      relation, registration, customer type, electronic, money, applies to) and
--      a treatment, with refusal message, invoice note, evidence policy and
--      fallback. Defaults are today's shape (same country, every condition ANY,
--      CHARGE), so a rule saved by today's Tax Master form keeps today's meaning.
--      Existing rows: reference-1 SERVICE rows → ALL (the franchise default);
--      PRODUCT rows stay SPECIFIC (the reference is the product).
--      uq_tax_master (which keyed on tax_code) is replaced by a unique index over
--      the precedence dimensions + effective_from on active, non-fallback rules.
--      A new ALL rule stores reference_id 0 (ignored).
--
--   5. Seeded rules reproducing today's outcomes (decision 5), following today's
--      generic branches. Each seed is a twin of one active same-country rule
--      version ("source"): same franchise, applies-to / reference, effective
--      dates, and (except where fixed below) tax system, rate, inclusive flag,
--      category and HSN/SAC, because today's export and IGST branches price at
--      the matched rule's rate:
--        Indian GST services: any foreign + money FOREIGN  → EXPORT_LUT_OR_TAX
--                             any foreign + money DOMESTIC → CHARGE (IGST)
--        Indian GST goods:    any foreign → EXPORT_LUT_OR_TAX
--        VAT services:        any foreign → ZERO_RATED_EXPORT 0%; for a UAE
--                             supplier with evidence required (ER Art 31) and a
--                             fallback-only CHARGE VAT 5% STANDARD twin (Art 3)
--      And per franchise:
--        Indian franchise selling goods: same country, other State, unregistered
--          → REFUSE (CGST s.24(i)); CHARGE NONE 0% instead when today's CA
--          override ALLOW_UNREGISTERED_INTERSTATE_GOODS is 'true'
--        VAT franchise: goods to any foreign country → ZERO_RATED_EXPORT 0%
--          (UAE ER Art 30), from its earliest VAT rule
--      Any existing rule with the same conditions and effective_from (active or
--      not) suppresses a seed: rules are owner data. NOTICEs list an active
--      franchise left without foreign rules for a business type it runs, and a
--      VAT source inclusive above 0% (its exports now back out at 0%, D6).
--
--   6. Stored decision per sale (decision 13): tax_master_id, tax_registration_id,
--      tax_evidence, customer_type, customer_registration_country,
--      payer_account_country, and the goods-export documents (decision 11).
--
-- Deploy order: run 146 BEFORE the group 1 code (MstTaxMaster reads the new
-- columns, and today's lookup is limited to today's rule shape until group 6).
-- Idempotent and transactional: a second run changes nothing.
-- =============================================================================

BEGIN;

-- Franchise, its latest active address country / currency, and normalised numbers
CREATE OR REPLACE TEMP VIEW tmp146_franchise AS
SELECT f.franchise_id,
       f.franchise_code,
       coalesce(f.active, TRUE)                                              AS active,
       f.start_date,
       f.business_type,
       f.gst_number,
       f.vat_number,
       upper(regexp_replace(coalesce(f.gst_number, ''), '[^A-Za-z0-9]', '', 'g')) AS gstin,
       upper(regexp_replace(coalesce(f.vat_number, ''), '[^A-Za-z0-9]', '', 'g')) AS vat,
       upper(trim(c.country_code))                                           AS address_country,
       upper(trim(c.currency_code))                                          AS address_currency
FROM public.mst_franchises f
         LEFT JOIN LATERAL (SELECT a.country_id
                            FROM public.txn_addresses a
                            WHERE a.table_id = 4 AND a.pk_of_table = f.franchise_id AND a.active
                            ORDER BY a.address_id DESC
                            LIMIT 1) addr ON TRUE
         LEFT JOIN public.mst_countries c ON c.country_id = addr.country_id;

-- ------------------------------------------------- 3a. aborts (before any change)
DO
$$
DECLARE
    bad RECORD;
BEGIN
    -- Only before the rule columns exist: afterwards the unique index guards the key
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'mst_tax_master' AND column_name = 'treatment') THEN
        FOR bad IN
            SELECT string_agg(t.id || ' (' || t.tax_code || ')', ', ' ORDER BY t.id) AS rules
            FROM public.mst_tax_master t
            WHERE t.active
            GROUP BY t.franchise_id, upper(trim(t.country_code)), t.transaction_type,
                     CASE WHEN t.transaction_type = 'SERVICE' AND t.reference_id = 1 THEN 0 ELSE t.reference_id END,
                     t.effective_from
            HAVING count(*) > 1
            LOOP
                RAISE EXCEPTION 'Migration 146 aborted: active Tax Master rules % have the same franchise, country, type, reference and effective date (they differ only in tax_code). Deactivate all but one in Tax Master, then run 146 again.',
                    bad.rules;
            END LOOP;
    END IF;
    FOR bad IN
        SELECT franchise_code, gst_number
        FROM tmp146_franchise
        WHERE active AND address_country = 'IN' AND gstin <> '' AND gstin !~ '^[0-9]{2}[A-Z0-9]{13}$'
        LOOP
            RAISE EXCEPTION 'Migration 146 aborted: franchise % has the GSTIN "%", which is not 15 characters starting with the State code. Today it charges GST with it; correct it on the franchise form, then run 146 again.',
                bad.franchise_code, bad.gst_number;
        END LOOP;
    FOR bad IN
        SELECT gstin AS number, string_agg(franchise_code, ', ' ORDER BY franchise_id) AS franchises
        FROM tmp146_franchise
        WHERE active AND address_country = 'IN' AND gstin <> ''
        GROUP BY gstin
        HAVING count(*) > 1
        LOOP
            RAISE EXCEPTION 'Migration 146 aborted: duplicate GSTIN % is held by the Indian franchises %. A GSTIN belongs to one registration: clear the copy on the franchise form, then run 146 again.',
                bad.number, bad.franchises;
        END LOOP;
    FOR bad IN
        SELECT vat AS number, address_country, string_agg(franchise_code, ', ' ORDER BY franchise_id) AS franchises
        FROM tmp146_franchise
        WHERE active AND vat <> '' AND address_country IS NOT NULL AND address_country <> 'IN'
        GROUP BY vat, address_country
        HAVING count(*) > 1
        LOOP
            RAISE EXCEPTION 'Migration 146 aborted: duplicate VAT number % (%) is held by the franchises %. Clear the copy on the franchise form, then run 146 again.',
                bad.number, bad.address_country, bad.franchises;
        END LOOP;
END
$$;

-- ------------------------------------------------- 1. registrations
CREATE TABLE IF NOT EXISTS public.mst_franchise_tax_registrations
(
    tax_registration_id   SERIAL PRIMARY KEY,
    franchise_id          INTEGER         NOT NULL REFERENCES public.mst_franchises (franchise_id),
    country_code          VARCHAR(3)      NOT NULL,
    tax_system            public.tax_type NOT NULL,
    registration_number   VARCHAR(50)     NOT NULL,
    state_code            VARCHAR(10),
    iec_number            VARCHAR(10),
    currency_code         VARCHAR(3)      NOT NULL,
    effective_from        DATE            NOT NULL,
    effective_to          DATE,
    invoice_prefix        VARCHAR(5),
    invoice_number_format VARCHAR(40),
    fy_start_month        SMALLINT,
    active                BOOLEAN         NOT NULL DEFAULT TRUE,
    created_by            INTEGER         NOT NULL REFERENCES public.mst_admin_users (admin_id),
    modified_by           INTEGER         NOT NULL REFERENCES public.mst_admin_users (admin_id),
    created_at            TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ     NOT NULL DEFAULT now(),
    created_ip            VARCHAR(50)     NOT NULL,
    modified_ip           VARCHAR(50)     NOT NULL,
    CONSTRAINT chk_mst_franchise_tax_registrations_system CHECK (tax_system <> 'NONE'),
    -- GST is India's (CGST s.25); a GST registration is per State, so it carries one
    CONSTRAINT chk_mst_franchise_tax_registrations_gst CHECK (tax_system <> 'GST' OR (country_code = 'IN' AND state_code IS NOT NULL)),
    CONSTRAINT chk_mst_franchise_tax_registrations_codes CHECK (country_code = upper(country_code) AND currency_code = upper(currency_code)),
    CONSTRAINT chk_mst_franchise_tax_registrations_dates CHECK (effective_to IS NULL OR effective_to >= effective_from),
    CONSTRAINT chk_mst_franchise_tax_registrations_fy CHECK (fy_start_month IS NULL OR fy_start_month BETWEEN 1 AND 12)
);

COMMENT ON TABLE public.mst_franchise_tax_registrations IS 'Tax registrations per franchise × country × tax system (spec 2026-10-25-configurable-tax-treatment, decision 8). No active row = unregistered';
COMMENT ON COLUMN public.mst_franchise_tax_registrations.state_code IS 'GST: the State of the registration (GSTIN digits 1-2)';
COMMENT ON COLUMN public.mst_franchise_tax_registrations.iec_number IS 'Importer-Exporter Code (Foreign Trade Policy), needed for goods exports';
COMMENT ON COLUMN public.mst_franchise_tax_registrations.currency_code IS 'Currency the registration invoices and files in (ISO 4217)';
COMMENT ON COLUMN public.mst_franchise_tax_registrations.invoice_prefix IS 'Registration abroad: its own invoice prefix (CHECK and uniqueness added by migration 150)';

-- A number belongs to one active registration (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS ux_mst_franchise_tax_registrations_number
    ON public.mst_franchise_tax_registrations (country_code, tax_system, upper(registration_number))
    WHERE active;

CREATE INDEX IF NOT EXISTS ix_mst_franchise_tax_registrations_franchise
    ON public.mst_franchise_tax_registrations (franchise_id);

-- ------------------------------------------------- 2. franchise working currency
ALTER TABLE public.mst_franchises
    ADD COLUMN IF NOT EXISTS currency_code VARCHAR(3);

COMMENT ON COLUMN public.mst_franchises.currency_code IS 'Working (functional) currency of the franchise; invoice issue books FX equivalents in it (decision 17)';

UPDATE public.mst_franchises f
SET currency_code = v.address_currency
FROM tmp146_franchise v
WHERE v.franchise_id = f.franchise_id
  AND f.currency_code IS NULL
  AND coalesce(v.address_currency, '') <> '';

DO
$$
DECLARE
    missing TEXT;
BEGIN
    SELECT string_agg(franchise_code, ', ' ORDER BY franchise_id) INTO missing
    FROM public.mst_franchises
    WHERE currency_code IS NULL;
    IF missing IS NOT NULL THEN
        RAISE NOTICE 'Migration 146: no currency for franchise(s) % (no address, or its country has no currency_code). Set it on the franchise form.', missing;
    END IF;
END
$$;

-- ------------------------------------------------- 3b. registrations back-fill
DO
$$
DECLARE
    skipped RECORD;
BEGIN
    FOR skipped IN
        SELECT franchise_code, gst_number, coalesce(address_country, 'no address') AS country
        FROM tmp146_franchise
        WHERE gstin <> ''
          AND (address_country IS DISTINCT FROM 'IN' OR gstin !~ '^[0-9]{2}[A-Z0-9]{13}$')
        LOOP
            RAISE NOTICE 'Migration 146: GSTIN % on franchise % (country %) skipped: a GSTIN is registered only for an Indian franchise address and has 15 characters starting with the State code.',
                skipped.gst_number, skipped.franchise_code, skipped.country;
        END LOOP;
    FOR skipped IN
        SELECT franchise_code, vat_number, coalesce(address_country, 'no address') AS country
        FROM tmp146_franchise
        WHERE vat <> ''
          AND (address_country IS NULL OR address_country = 'IN' OR address_currency IS NULL)
        LOOP
            RAISE NOTICE 'Migration 146: VAT number % on franchise % (country %) skipped: no VAT registration in that country, or the country has no currency.',
                skipped.vat_number, skipped.franchise_code, skipped.country;
        END LOOP;
END
$$;

INSERT INTO public.mst_franchise_tax_registrations (franchise_id, country_code, tax_system, registration_number, state_code,
                                                    currency_code, effective_from, active,
                                                    created_by, modified_by, created_ip, modified_ip)
SELECT v.franchise_id, 'IN', 'GST'::public.tax_type, v.gstin, left(v.gstin, 2),
       coalesce(v.address_currency, 'INR'), v.start_date, v.active,
       1, 1, ':0', ':0'
FROM tmp146_franchise v
WHERE v.address_country = 'IN'
  AND v.gstin ~ '^[0-9]{2}[A-Z0-9]{13}$'
  AND NOT EXISTS (SELECT 1
                  FROM public.mst_franchise_tax_registrations r
                  WHERE r.franchise_id = v.franchise_id AND r.country_code = 'IN' AND r.tax_system = 'GST')
UNION ALL
SELECT v.franchise_id, v.address_country, 'VAT'::public.tax_type, v.vat, NULL,
       v.address_currency, v.start_date, v.active,
       1, 1, ':0', ':0'
FROM tmp146_franchise v
WHERE v.vat <> ''
  AND v.address_country <> 'IN'
  AND v.address_currency IS NOT NULL
  AND NOT EXISTS (SELECT 1
                  FROM public.mst_franchise_tax_registrations r
                  WHERE r.franchise_id = v.franchise_id AND r.country_code = v.address_country AND r.tax_system = 'VAT');

-- ------------------------------------------------- 4. treatment rules
-- Columns and the mapping of today's rows run once (the mapping is not repeated on a re-run,
-- so a rule the owner changed later is never reset).
DO
$$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'mst_tax_master' AND column_name = 'treatment') THEN
        ALTER TABLE public.mst_tax_master
            ADD COLUMN customer_scope               VARCHAR(20)  NOT NULL DEFAULT 'SAME_COUNTRY',
            ADD COLUMN place_of_supply_country_code VARCHAR(3),
            ADD COLUMN state_relation               VARCHAR(10)  NOT NULL DEFAULT 'ANY',
            ADD COLUMN registration_condition       VARCHAR(15)  NOT NULL DEFAULT 'ANY',
            ADD COLUMN customer_type_condition      VARCHAR(5)   NOT NULL DEFAULT 'ANY',
            ADD COLUMN electronic_condition         VARCHAR(5)   NOT NULL DEFAULT 'ANY',
            ADD COLUMN money_condition              VARCHAR(10)  NOT NULL DEFAULT 'ANY',
            ADD COLUMN applies_to                   VARCHAR(10)  NOT NULL DEFAULT 'SPECIFIC',
            ADD COLUMN treatment                    VARCHAR(25)  NOT NULL DEFAULT 'CHARGE',
            ADD COLUMN refusal_message              VARCHAR(500),
            ADD COLUMN invoice_note                 TEXT,
            ADD COLUMN requires_evidence            BOOLEAN      NOT NULL DEFAULT FALSE,
            ADD COLUMN fallback_tax_master_id       INTEGER REFERENCES public.mst_tax_master (id),
            ADD COLUMN fallback_only                BOOLEAN      NOT NULL DEFAULT FALSE;

        -- Today's default service rule (reference 1) applies to every plan without its own rule
        UPDATE public.mst_tax_master
        SET applies_to = 'ALL'
        WHERE transaction_type = 'SERVICE'
          AND reference_id = 1;
    END IF;
END
$$;

COMMENT ON COLUMN public.mst_tax_master.country_code IS 'Supplier country of the rule (the franchise''s, or a registration''s abroad)';
COMMENT ON COLUMN public.mst_tax_master.customer_scope IS 'SAME_COUNTRY | SPECIFIC_COUNTRY | ANY_FOREIGN | ANY. Place of supply: billing address for services, delivery address for goods, GSTIN State for India B2B services';
COMMENT ON COLUMN public.mst_tax_master.place_of_supply_country_code IS 'The country when customer_scope = SPECIFIC_COUNTRY';
COMMENT ON COLUMN public.mst_tax_master.state_relation IS 'ANY | SAME | OTHER (an unknown State counts as OTHER); same-country rules only';
COMMENT ON COLUMN public.mst_tax_master.registration_condition IS 'ANY | REGISTERED | UNREGISTERED, from mst_franchise_tax_registrations';
COMMENT ON COLUMN public.mst_tax_master.customer_type_condition IS 'ANY | B2B | B2C';
COMMENT ON COLUMN public.mst_tax_master.electronic_condition IS 'ANY | YES | NO (mst_program_plans.is_electronic_service)';
COMMENT ON COLUMN public.mst_tax_master.money_condition IS 'ANY | DOMESTIC | FOREIGN (the payment route); services only';
COMMENT ON COLUMN public.mst_tax_master.applies_to IS 'ALL plans / products, or the SPECIFIC one in reference_id (ignored, 0, for ALL)';
COMMENT ON COLUMN public.mst_tax_master.treatment IS 'CHARGE | ZERO_RATED_EXPORT | EXPORT_LUT_OR_TAX | OUT_OF_SCOPE | REFUSE | FOREIGN_REGISTRATION';
COMMENT ON COLUMN public.mst_tax_master.requires_evidence IS 'Zero-rating evidence policy (decision 9): a mismatch needs a finance decision or the fallback';
COMMENT ON COLUMN public.mst_tax_master.fallback_only IS 'Never matched directly; used only as another rule''s fallback';

DO
$$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_mst_tax_master_customer_scope') THEN
        ALTER TABLE public.mst_tax_master
            ADD CONSTRAINT chk_mst_tax_master_customer_scope
                CHECK (customer_scope IN ('SAME_COUNTRY', 'SPECIFIC_COUNTRY', 'ANY_FOREIGN', 'ANY')),
            -- A specific country is a foreign one, and only a SPECIFIC_COUNTRY rule names it
            ADD CONSTRAINT chk_mst_tax_master_place_of_supply_country
                CHECK ((customer_scope = 'SPECIFIC_COUNTRY') = (place_of_supply_country_code IS NOT NULL)
                    AND (place_of_supply_country_code IS NULL
                        OR (place_of_supply_country_code = upper(place_of_supply_country_code)
                            AND place_of_supply_country_code <> upper(trim(country_code))))),
            ADD CONSTRAINT chk_mst_tax_master_state_relation
                CHECK (state_relation IN ('ANY', 'SAME', 'OTHER') AND (state_relation = 'ANY' OR customer_scope = 'SAME_COUNTRY')),
            -- VAT is charged only by a registrant (UAE Decree-Law Art 50)
            ADD CONSTRAINT chk_mst_tax_master_registration_condition
                CHECK (registration_condition IN ('ANY', 'REGISTERED', 'UNREGISTERED')
                    AND NOT (tax_system = 'VAT' AND registration_condition = 'UNREGISTERED')),
            ADD CONSTRAINT chk_mst_tax_master_customer_type_condition
                CHECK (customer_type_condition IN ('ANY', 'B2B', 'B2C')),
            ADD CONSTRAINT chk_mst_tax_master_electronic_condition
                CHECK (electronic_condition IN ('ANY', 'YES', 'NO')),
            -- Goods follow movement, not money
            ADD CONSTRAINT chk_mst_tax_master_money_condition
                CHECK (money_condition IN ('ANY', 'DOMESTIC', 'FOREIGN') AND (money_condition = 'ANY' OR transaction_type = 'SERVICE')),
            ADD CONSTRAINT chk_mst_tax_master_applies_to
                CHECK (applies_to IN ('ALL', 'SPECIFIC')),
            ADD CONSTRAINT chk_mst_tax_master_treatment
                CHECK (treatment IN ('CHARGE', 'ZERO_RATED_EXPORT', 'EXPORT_LUT_OR_TAX', 'OUT_OF_SCOPE', 'REFUSE', 'FOREIGN_REGISTRATION')),
            -- GST and the LUT are India's (IGST s.16, Rule 96A); zero-rated exports are VAT's
            ADD CONSTRAINT chk_mst_tax_master_gst_india
                CHECK (tax_system <> 'GST' OR upper(trim(country_code)) = 'IN'),
            ADD CONSTRAINT chk_mst_tax_master_lut_gst
                CHECK (treatment <> 'EXPORT_LUT_OR_TAX' OR tax_system = 'GST'),
            ADD CONSTRAINT chk_mst_tax_master_zero_rated_vat
                CHECK (treatment <> 'ZERO_RATED_EXPORT' OR tax_system = 'VAT'),
            ADD CONSTRAINT chk_mst_tax_master_refusal_message
                CHECK (treatment <> 'REFUSE' OR length(trim(coalesce(refusal_message, ''))) > 0),
            ADD CONSTRAINT chk_mst_tax_master_rate
                CHECK (tax_percent IS NULL OR tax_percent BETWEEN 0 AND 100),
            -- An evidence rule names a fallback; a fallback never needs evidence itself
            ADD CONSTRAINT chk_mst_tax_master_evidence
                CHECK (NOT requires_evidence OR (fallback_tax_master_id IS NOT NULL AND NOT fallback_only)),
            ADD CONSTRAINT chk_mst_tax_master_fallback_self
                CHECK (fallback_tax_master_id IS NULL OR fallback_tax_master_id <> id);
    END IF;
END
$$;

-- Export, out-of-scope and foreign-registration treatments need a foreign scope: with scope ANY they could
-- match a domestic sale (D7). Re-created on every run, so a database that ran an earlier draft converges.
ALTER TABLE public.mst_tax_master
    DROP CONSTRAINT IF EXISTS chk_mst_tax_master_export_scope;
ALTER TABLE public.mst_tax_master
    ADD CONSTRAINT chk_mst_tax_master_export_scope
        CHECK (treatment NOT IN ('ZERO_RATED_EXPORT', 'EXPORT_LUT_OR_TAX', 'OUT_OF_SCOPE', 'FOREIGN_REGISTRATION')
            OR customer_scope IN ('ANY_FOREIGN', 'SPECIFIC_COUNTRY'));

-- tax_code is a label only (decision 4): the old key is replaced by the precedence dimensions
ALTER TABLE public.mst_tax_master
    DROP CONSTRAINT IF EXISTS uq_tax_master;

CREATE UNIQUE INDEX IF NOT EXISTS ux_mst_tax_master_rule
    ON public.mst_tax_master (franchise_id, upper(trim(country_code)), transaction_type, customer_scope,
                              coalesce(place_of_supply_country_code, ''), state_relation, registration_condition,
                              customer_type_condition, electronic_condition, money_condition, applies_to,
                              (CASE WHEN applies_to = 'SPECIFIC' THEN reference_id ELSE 0 END), effective_from)
    WHERE active AND NOT fallback_only;

-- ------------------------------------------------- 5. seeded rules
-- Sources: active rule versions of today's shape. seed_reference is the reference a twin stores.
CREATE OR REPLACE TEMP VIEW tmp146_source AS
SELECT t.*,
       upper(trim(t.country_code))                                 AS supplier,
       CASE WHEN t.applies_to = 'ALL' THEN 0 ELSE t.reference_id END AS seed_reference
FROM public.mst_tax_master t
WHERE t.active
  AND t.customer_scope = 'SAME_COUNTRY' AND t.state_relation = 'ANY' AND t.registration_condition = 'ANY'
  AND t.customer_type_condition = 'ANY' AND t.electronic_condition = 'ANY' AND t.money_condition = 'ANY'
  AND t.treatment = 'CHARGE' AND NOT t.fallback_only;

-- Does a rule (active or not) with these conditions and date exist? Then the seed is suppressed.
CREATE OR REPLACE FUNCTION pg_temp.rule_exists(p_franchise INTEGER, p_type TEXT, p_scope TEXT, p_state TEXT, p_registration TEXT,
                                    p_money TEXT, p_applies_to TEXT, p_reference BIGINT, p_from DATE,
                                    p_fallback_only BOOLEAN) RETURNS BOOLEAN AS
$$
SELECT EXISTS (SELECT 1
               FROM public.mst_tax_master t
               WHERE t.franchise_id = p_franchise AND t.transaction_type::TEXT = p_type AND t.customer_scope = p_scope
                 AND t.place_of_supply_country_code IS NULL AND t.state_relation = p_state
                 AND t.registration_condition = p_registration AND t.customer_type_condition = 'ANY'
                 AND t.electronic_condition = 'ANY' AND t.money_condition = p_money AND t.applies_to = p_applies_to
                 AND (p_applies_to = 'ALL' OR t.reference_id = p_reference)
                 AND t.effective_from = p_from AND t.fallback_only = p_fallback_only)
$$ LANGUAGE sql STABLE;

-- Indian GST services to a client outside India, foreign money: export, 0% under a valid LUT, else IGST paid
INSERT INTO public.mst_tax_master (franchise_id, reference_id, country_code, transaction_type, tax_system, tax_code, tax_name,
                                   tax_percent, apply_on, is_tax_inclusive, tax_category, hsn_sac_code, legal_basis,
                                   effective_from, effective_to, active, customer_scope, money_condition, applies_to, treatment,
                                   created_by, modified_by, created_at, updated_at, created_ip, modified_ip)
SELECT s.franchise_id, s.seed_reference, 'IN', 'SERVICE', s.tax_system, 'EXPORT_LUT', 'Export of service: 0% under LUT, else IGST',
       s.tax_percent, s.apply_on, s.is_tax_inclusive, s.tax_category, s.hsn_sac_code,
       'IGST Act s.2(6): export of services needs a recipient outside India and payment in convertible foreign exchange (or INR as RBI permits: Vostro, NRE/FCNR, Circular 202/14/2023). IGST s.16 and CGST Rule 96A: zero-rated under a valid LUT, otherwise IGST paid and refunded; Rule 46 endorsement on the invoice.',
       s.effective_from, s.effective_to, TRUE, 'ANY_FOREIGN', 'FOREIGN', s.applies_to, 'EXPORT_LUT_OR_TAX',
       1, 1, now(), now(), ':0', ':0'
FROM tmp146_source s
WHERE s.transaction_type = 'SERVICE' AND s.tax_system = 'GST' AND s.supplier = 'IN'
  AND NOT pg_temp.rule_exists(s.franchise_id, 'SERVICE', 'ANY_FOREIGN', 'ANY', 'ANY', 'FOREIGN', s.applies_to, s.seed_reference, s.effective_from, FALSE);

-- Indian GST services to a client outside India paying INR over Indian payment methods: not an export, IGST
INSERT INTO public.mst_tax_master (franchise_id, reference_id, country_code, transaction_type, tax_system, tax_code, tax_name,
                                   tax_percent, apply_on, is_tax_inclusive, tax_category, hsn_sac_code, legal_basis,
                                   effective_from, effective_to, active, customer_scope, money_condition, applies_to, treatment,
                                   created_by, modified_by, created_at, updated_at, created_ip, modified_ip)
SELECT s.franchise_id, s.seed_reference, 'IN', 'SERVICE', s.tax_system, 'IGST_ABROAD_INR', 'IGST: client abroad paying INR in India',
       s.tax_percent, s.apply_on, s.is_tax_inclusive, s.tax_category, s.hsn_sac_code,
       'IGST Act s.2(6)(iv): INR received over Indian payment methods is not export proceeds, so the supply is not an export. IGST s.7(5)(a): a supply with the place of supply outside India is inter-state, so IGST is charged with no State.',
       s.effective_from, s.effective_to, TRUE, 'ANY_FOREIGN', 'DOMESTIC', s.applies_to, 'CHARGE',
       1, 1, now(), now(), ':0', ':0'
FROM tmp146_source s
WHERE s.transaction_type = 'SERVICE' AND s.tax_system = 'GST' AND s.supplier = 'IN'
  AND NOT pg_temp.rule_exists(s.franchise_id, 'SERVICE', 'ANY_FOREIGN', 'ANY', 'ANY', 'DOMESTIC', s.applies_to, s.seed_reference, s.effective_from, FALSE);

-- Indian GST goods delivered outside India: export, 0% under a valid LUT, else IGST, at the product's rate.
-- Refused while unregistered by the code invariant (decision 6), whatever this rule says.
INSERT INTO public.mst_tax_master (franchise_id, reference_id, country_code, transaction_type, tax_system, tax_code, tax_name,
                                   tax_percent, apply_on, is_tax_inclusive, tax_category, hsn_sac_code, legal_basis,
                                   effective_from, effective_to, active, customer_scope, applies_to, treatment,
                                   created_by, modified_by, created_at, updated_at, created_ip, modified_ip)
SELECT s.franchise_id, s.seed_reference, 'IN', 'PRODUCT', s.tax_system, 'EXPORT_GOODS', 'Export of goods: 0% under LUT, else IGST',
       s.tax_percent, s.apply_on, s.is_tax_inclusive, s.tax_category, s.hsn_sac_code,
       'IGST Act s.16 and CGST Rule 96: goods leaving India are zero-rated under a valid LUT, otherwise IGST is paid and refunded (shipping bill / CSB-V as the export record). An unregistered franchise cannot export (CGST s.24(i)); this rule then never prices a sale.',
       s.effective_from, s.effective_to, TRUE, 'ANY_FOREIGN', s.applies_to, 'EXPORT_LUT_OR_TAX',
       1, 1, now(), now(), ':0', ':0'
FROM tmp146_source s
WHERE s.transaction_type = 'PRODUCT' AND s.tax_system = 'GST' AND s.supplier = 'IN'
  AND NOT pg_temp.rule_exists(s.franchise_id, 'PRODUCT', 'ANY_FOREIGN', 'ANY', 'ANY', 'ANY', s.applies_to, s.seed_reference, s.effective_from, FALSE);

-- UAE suppliers' fallback (never matched directly): standard-rated 5% when the Art 31 evidence does not hold
INSERT INTO public.mst_tax_master (franchise_id, reference_id, country_code, transaction_type, tax_system, tax_code, tax_name,
                                   tax_percent, apply_on, is_tax_inclusive, tax_category, hsn_sac_code, legal_basis,
                                   effective_from, effective_to, active, customer_scope, applies_to, treatment, fallback_only,
                                   created_by, modified_by, created_at, updated_at, created_ip, modified_ip)
SELECT s.franchise_id, s.seed_reference, 'AE', 'SERVICE', 'VAT', 'VAT_5_FALLBACK', 'UAE VAT 5% (export evidence not held)',
       5.00, s.apply_on, s.is_tax_inclusive, 'STANDARD', s.hsn_sac_code,
       'Federal Decree-Law 8/2017 Art 3: standard rate 5%. Used only as the fallback of the zero-rated export rule when the Executive Regulation Art 31 evidence does not hold (spec decision 9).',
       s.effective_from, s.effective_to, TRUE, 'ANY_FOREIGN', s.applies_to, 'CHARGE', TRUE,
       1, 1, now(), now(), ':0', ':0'
FROM tmp146_source s
WHERE s.transaction_type = 'SERVICE' AND s.tax_system = 'VAT' AND s.supplier = 'AE'
  AND NOT pg_temp.rule_exists(s.franchise_id, 'SERVICE', 'ANY_FOREIGN', 'ANY', 'ANY', 'ANY', s.applies_to, s.seed_reference, s.effective_from, TRUE);

-- VAT services to a recipient outside the supplier's country: zero-rated export. For a UAE supplier the
-- Art 31 evidence is required, with the fallback above.
INSERT INTO public.mst_tax_master (franchise_id, reference_id, country_code, transaction_type, tax_system, tax_code, tax_name,
                                   tax_percent, apply_on, is_tax_inclusive, tax_category, hsn_sac_code, legal_basis,
                                   effective_from, effective_to, active, customer_scope, applies_to, treatment, invoice_note,
                                   requires_evidence, fallback_tax_master_id,
                                   created_by, modified_by, created_at, updated_at, created_ip, modified_ip)
SELECT s.franchise_id, s.seed_reference, s.supplier, 'SERVICE', 'VAT', 'VAT_0_EXPORT',
       CASE WHEN s.supplier = 'AE' THEN 'UAE VAT 0% (zero-rated export of services)' ELSE 'VAT 0% (zero-rated export of services)' END,
       0.00, s.apply_on, s.is_tax_inclusive, 'ZERO_RATED', s.hsn_sac_code,
       CASE WHEN s.supplier = 'AE'
                THEN 'UAE VAT Executive Regulation Art 31(1)(a) and (2) (as amended by CD 100/2024): services to a recipient with no place of residence in the UAE who is outside the UAE when the services are performed (fewer than 30 days in a rolling 12 months, FTA VATP040); not for electronic services used or enjoyed in the UAE. The supplier holds the evidence.'
            ELSE 'Zero-rated export of services, as priced before 4.14. Record this country''s legal basis.' END,
       s.effective_from, s.effective_to, TRUE, 'ANY_FOREIGN', s.applies_to, 'ZERO_RATED_EXPORT',
       CASE WHEN s.supplier = 'AE' THEN 'Zero-rated supply of services to a recipient outside the UAE.' END,
       s.supplier = 'AE', fb.id,
       1, 1, now(), now(), ':0', ':0'
FROM tmp146_source s
         LEFT JOIN LATERAL (SELECT t.id
                            FROM public.mst_tax_master t
                            WHERE s.supplier = 'AE'
                              AND t.franchise_id = s.franchise_id AND t.transaction_type = 'SERVICE' AND t.customer_scope = 'ANY_FOREIGN'
                              AND t.applies_to = s.applies_to AND (s.applies_to = 'ALL' OR t.reference_id = s.reference_id)
                              AND t.effective_from = s.effective_from AND t.fallback_only AND t.treatment = 'CHARGE'
                            ORDER BY t.active DESC, t.id DESC
                            LIMIT 1) fb ON TRUE
WHERE s.transaction_type = 'SERVICE' AND s.tax_system = 'VAT'
  AND (s.supplier <> 'AE' OR fb.id IS NOT NULL)
  AND NOT pg_temp.rule_exists(s.franchise_id, 'SERVICE', 'ANY_FOREIGN', 'ANY', 'ANY', 'ANY', s.applies_to, s.seed_reference, s.effective_from, FALSE);

-- Indian franchises selling goods, to another State (or an unknown one) while unregistered: CGST s.24(i).
-- REFUSE, unless today's CA override ALLOW_UNREGISTERED_INTERSTATE_GOODS is 'true' (then no tax, as today).
INSERT INTO public.mst_tax_master (franchise_id, reference_id, country_code, transaction_type, tax_system, tax_code, tax_name,
                                   tax_percent, apply_on, is_tax_inclusive, tax_category, hsn_sac_code, legal_basis,
                                   effective_from, effective_to, active, customer_scope, state_relation, registration_condition,
                                   applies_to, treatment, refusal_message,
                                   created_by, modified_by, created_at, updated_at, created_ip, modified_ip)
SELECT v.franchise_id, 0, 'IN', 'PRODUCT', 'NONE',
       CASE WHEN o.allowed THEN 'NONE_S24_OVERRIDE' ELSE 'REFUSE_S24' END,
       CASE WHEN o.allowed THEN 'No GST: inter-state goods while unregistered (CA override)'
            ELSE 'Refused: inter-state goods without GST registration' END,
       0.00, 'SALE', FALSE, 'STANDARD', NULL,
       CASE WHEN o.allowed
                THEN 'CGST Act s.24(i) requires registration for inter-state supplies of goods whatever the turnover. The CA accepted the risk explicitly (config ALLOW_UNREGISTERED_INTERSTATE_GOODS = true before 4.14), so these sales are invoiced without GST.'
            ELSE 'CGST Act s.24(i): a person making inter-state taxable supplies of goods must register whatever the turnover (Notif 10/2017-IT exempts only services). An unknown delivery State counts as another State. The owner may change this rule to CHARGE on the CA''s advice.' END,
       DATE '2017-07-01', NULL, TRUE, 'SAME_COUNTRY', 'OTHER', 'UNREGISTERED', 'ALL',
       CASE WHEN o.allowed THEN 'CHARGE' ELSE 'REFUSE' END,
       CASE WHEN o.allowed THEN NULL
            ELSE 'Inter-state goods supply needs GST registration (CGST s.24(i)). Ask the CA, or deliver within the franchise state.' END,
       1, 1, now(), now(), ':0', ':0'
FROM tmp146_franchise v
         CROSS JOIN (SELECT coalesce((SELECT lower(trim(config_value)) = 'true'
                                      FROM public.mst_configs
                                      WHERE config_name = 'ALLOW_UNREGISTERED_INTERSTATE_GOODS'
                                      LIMIT 1), FALSE) AS allowed) o
WHERE v.address_country = 'IN'
  AND 'product' = ANY (v.business_type)
  AND NOT pg_temp.rule_exists(v.franchise_id, 'PRODUCT', 'SAME_COUNTRY', 'OTHER', 'UNREGISTERED', 'ANY', 'ALL', 0, DATE '2017-07-01', FALSE);

-- VAT franchises: goods leaving the country, zero-rated export, from the franchise's earliest VAT rule
INSERT INTO public.mst_tax_master (franchise_id, reference_id, country_code, transaction_type, tax_system, tax_code, tax_name,
                                   tax_percent, apply_on, is_tax_inclusive, tax_category, hsn_sac_code, legal_basis,
                                   effective_from, effective_to, active, customer_scope, applies_to, treatment, invoice_note,
                                   created_by, modified_by, created_at, updated_at, created_ip, modified_ip)
SELECT s.franchise_id, 0, s.supplier, 'PRODUCT', 'VAT', 'VAT_0_EXPORT_GOODS',
       CASE WHEN s.supplier = 'AE' THEN 'UAE VAT 0% (zero-rated export of goods)' ELSE 'VAT 0% (zero-rated export of goods)' END,
       0.00, 'SALE', FALSE, 'ZERO_RATED', NULL,
       CASE WHEN s.supplier = 'AE'
                THEN 'UAE VAT Executive Regulation Art 30: goods exported outside the UAE within 90 days of the supply, with official and commercial evidence of the export.'
            ELSE 'Zero-rated export of goods, as priced before 4.14. Record this country''s legal basis.' END,
       s.effective_from, NULL, TRUE, 'ANY_FOREIGN', 'ALL', 'ZERO_RATED_EXPORT',
       CASE WHEN s.supplier = 'AE' THEN 'Zero-rated export of goods to a destination outside the UAE.' END,
       1, 1, now(), now(), ':0', ':0'
FROM (SELECT DISTINCT ON (franchise_id) franchise_id, supplier, effective_from
      FROM tmp146_source
      WHERE tax_system = 'VAT'
      ORDER BY franchise_id, effective_from) s
WHERE NOT EXISTS (SELECT 1 FROM public.mst_tax_master t
                  WHERE t.franchise_id = s.franchise_id AND t.transaction_type = 'PRODUCT' AND t.customer_scope = 'ANY_FOREIGN'
                    AND t.state_relation = 'ANY' AND t.registration_condition = 'ANY' AND t.customer_type_condition = 'ANY'
                    AND t.electronic_condition = 'ANY' AND t.money_condition = 'ANY' AND t.applies_to = 'ALL' AND NOT t.fallback_only);

-- What the seeds could not cover
DO
$$
DECLARE
    gap RECORD;
BEGIN
    FOR gap IN
        SELECT v.franchise_code, upper(bt::TEXT) AS transaction_type
        FROM tmp146_franchise v
                 CROSS JOIN LATERAL unnest(v.business_type) bt
        WHERE v.active
          AND NOT EXISTS (SELECT 1 FROM public.mst_tax_master t
                          WHERE t.franchise_id = v.franchise_id AND t.transaction_type::TEXT = upper(bt::TEXT)
                            AND t.customer_scope IN ('ANY_FOREIGN', 'SPECIFIC_COUNTRY') AND t.active AND NOT t.fallback_only)
        LOOP
            RAISE NOTICE 'Migration 146: franchise % has no rule for % sales abroad (no active GST / VAT rate rule to copy). After group 6 such a sale gets "no tax rule"; add one in Tax Master if it sells abroad.',
                gap.franchise_code, gap.transaction_type;
        END LOOP;
    FOR gap IN
        SELECT s.id, s.tax_code, s.tax_percent
        FROM tmp146_source s
        WHERE s.tax_system = 'VAT' AND s.is_tax_inclusive AND coalesce(s.tax_percent, 0) > 0
        LOOP
            RAISE NOTICE 'Migration 146: VAT rule % (%) is tax-inclusive at % percent. Its zero-rated export twin backs out 0%% (decision 6), where today an export backs out % percent first: check the prices of its exports.',
                gap.id, gap.tax_code, gap.tax_percent, gap.tax_percent;
        END LOOP;
END
$$;

-- ------------------------------------------------- 6. stored decision per sale
ALTER TABLE public.txn_member_payments
    ADD COLUMN IF NOT EXISTS tax_master_id                INTEGER REFERENCES public.mst_tax_master (id),
    ADD COLUMN IF NOT EXISTS tax_registration_id          INTEGER REFERENCES public.mst_franchise_tax_registrations (tax_registration_id),
    ADD COLUMN IF NOT EXISTS tax_evidence                 JSONB,
    ADD COLUMN IF NOT EXISTS customer_type                VARCHAR(3) CHECK (customer_type IN ('B2B', 'B2C')),
    ADD COLUMN IF NOT EXISTS customer_registration_country VARCHAR(3),
    ADD COLUMN IF NOT EXISTS payer_account_country        VARCHAR(3);

ALTER TABLE public.txn_member_products
    ADD COLUMN IF NOT EXISTS tax_registration_id          INTEGER REFERENCES public.mst_franchise_tax_registrations (tax_registration_id),
    ADD COLUMN IF NOT EXISTS tax_evidence                 JSONB,
    ADD COLUMN IF NOT EXISTS customer_type                VARCHAR(3) CHECK (customer_type IN ('B2B', 'B2C')),
    ADD COLUMN IF NOT EXISTS customer_registration_country VARCHAR(3),
    ADD COLUMN IF NOT EXISTS payer_account_country        VARCHAR(3),
    ADD COLUMN IF NOT EXISTS export_document_type         VARCHAR(20) CHECK (export_document_type IN ('SHIPPING_BILL', 'CSB_V', 'POSTAL_BILL')),
    ADD COLUMN IF NOT EXISTS export_document_number       VARCHAR(50),
    ADD COLUMN IF NOT EXISTS export_document_date         DATE,
    ADD COLUMN IF NOT EXISTS export_port_code             VARCHAR(10);

ALTER TABLE public.txn_member_product_order_items
    ADD COLUMN IF NOT EXISTS tax_master_id                INTEGER REFERENCES public.mst_tax_master (id),
    ADD COLUMN IF NOT EXISTS tax_registration_id          INTEGER REFERENCES public.mst_franchise_tax_registrations (tax_registration_id);

ALTER TABLE public.txn_credit_notes
    ADD COLUMN IF NOT EXISTS tax_registration_id          INTEGER REFERENCES public.mst_franchise_tax_registrations (tax_registration_id);

COMMENT ON COLUMN public.txn_member_payments.tax_master_id IS 'The Tax Master rule that priced the sale (decision 13); NULL before 146';
COMMENT ON COLUMN public.txn_member_payments.tax_registration_id IS 'The registration that charged the tax; NULL = unregistered (or before 146)';
COMMENT ON COLUMN public.txn_member_payments.tax_evidence IS 'Zero-rating evidence and any finance decision (decision 9)';
COMMENT ON COLUMN public.txn_member_payments.customer_type IS 'B2B when a valid customer GSTIN / TRN was given, else B2C (decision 10)';
COMMENT ON COLUMN public.txn_member_payments.customer_registration_country IS 'Country of the customer''s gst_number (GSTIN = IN, TRN = AE)';
COMMENT ON COLUMN public.txn_member_payments.payer_account_country IS 'Country of the account the client paid from (VAT evidence)';
COMMENT ON COLUMN public.txn_member_products.export_document_type IS 'Goods export record (decision 11): SHIPPING_BILL | CSB_V | POSTAL_BILL';
COMMENT ON COLUMN public.txn_member_products.export_port_code IS 'Port code of the shipping bill (GSTR-1 Table 6A)';

COMMIT;
