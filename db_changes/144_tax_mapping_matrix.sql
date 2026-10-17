-- =============================================================================
-- 144_tax_mapping_matrix.sql
-- Tax mapping matrix (roadmap 4.11, data half) — spec:
-- specs/features/2026-10-10-tax-mapping-matrix/requirements.md
-- =============================================================================
--   1. mst_tax_master.hsn_sac_code, legal_basis
--      Each rule carries the classification it prices (HSN for goods, SAC for
--      services) and the legal basis Accounts can quote (notification, article).
--
--   2. mst_program_plans.is_electronic_service
--      Flag only (UAE VAT ER Art 23 / "electronic service"). No engine branch
--      reads it until the UAE adviser answers requirements open question 7.
--
--   3. mst_countries.currency_code, and the missing ISO codes for AE / US
--      The functional currency of a franchise comes from its country, not from
--      an 'AE' → 'AED' literal in code.
--
--   4. place_of_supply_country_code / place_of_supply_state_code / hsn_sac_code
--      on txn_member_payments and txn_member_product_order_items
--      Stored when tax is decided (Circular 242/36/2024; principle 10). The
--      invoice prints the stored values; the address snapshot / product HSN /
--      DIET_SAC_CODE config are only fallbacks for rows priced before this.
--      Config ALLOW_UNREGISTERED_INTERSTATE_GOODS (default false) is the CA
--      override for the s.24(i) guard.
--
--   5. Seeded tax rules (guarded per franchise + reference + country + type —
--      any existing row, active or not, suppresses the seed; rules are owner data):
--        EFMUM  IN SERVICE  GST 18% STANDARD, SAC 999319, from 2017-07-01
--        HCUAE  AE SERVICE  VAT 0% ZERO_RATED, from 2018-01-01
--                           (basis: ER Art 41, confirmed by the UAE adviser 2026-10-17)
--        MEMUM  IN PRODUCT  per active product:
--                             NONE 0% (active)  — unregistered, CGST s.24(i)
--                             GST 5% STANDARD (INACTIVE, staged) — Notif 9/2025-CT(R)
--                             Sch. I (HSN 3004, confirmed 2026-10-17), from 2025-09-22.
--                           **The CA activates the GST_5 rows** (and deactivates
--                           NONE_0 / the old GST_12) once Mahi is registered. No
--                           deployment needed. The staged row is added even when an
--                           older GST rule exists (production has GST 12%); once
--                           active it wins because its effective_from is newer.
--
--        Existing EFMUM / HCUAE service rows (production) are skipped by the seeds but
--        get the confirmed legal_basis when that new column is still NULL.
--
-- Idempotent: safe to run twice. Seeds never update existing rows; the only update
-- fills the new legal_basis column where it is NULL.
-- =============================================================================

BEGIN;

-- ------------------------------------------------- 1. rule classification
ALTER TABLE public.mst_tax_master
    ADD COLUMN IF NOT EXISTS hsn_sac_code VARCHAR(8),
    ADD COLUMN IF NOT EXISTS legal_basis  TEXT;

COMMENT ON COLUMN public.mst_tax_master.hsn_sac_code IS 'HSN (goods) or SAC (services) the rule prices; printed on the invoice line';
COMMENT ON COLUMN public.mst_tax_master.legal_basis IS 'Notification / article / adviser note Accounts can quote for this rate';

-- Back-fill: product rules take the product HSN, service rules the diet SAC.
UPDATE public.mst_tax_master t
SET hsn_sac_code = left(regexp_replace(p.hsn_code, '\D', '', 'g'), 8)
FROM public.mst_product p
WHERE t.transaction_type = 'PRODUCT'
  AND t.reference_id = p.product_id
  AND t.hsn_sac_code IS NULL
  AND regexp_replace(p.hsn_code, '\D', '', 'g') <> '';

UPDATE public.mst_tax_master
SET hsn_sac_code = '999319'
WHERE transaction_type = 'SERVICE'
  AND hsn_sac_code IS NULL;

-- ------------------------------------------------- 2. electronic-service flag
ALTER TABLE public.mst_program_plans
    ADD COLUMN IF NOT EXISTS is_electronic_service BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.mst_program_plans.is_electronic_service IS 'UAE VAT ER Art 23: automated/app-delivered plan (true) vs human-delivered coaching (false). Stored only; adviser decision pending';

-- ------------------------------------------------- 3. country currency + codes
ALTER TABLE public.mst_countries
    ADD COLUMN IF NOT EXISTS currency_code CHAR(3);

UPDATE public.mst_countries SET country_code = 'AE' WHERE country_id = 221 AND country_code IS NULL;
UPDATE public.mst_countries SET country_code = 'US' WHERE country_id = 223 AND country_code IS NULL;

UPDATE public.mst_countries SET currency_code = 'INR' WHERE upper(trim(country_code)) = 'IN' AND currency_code IS NULL;
UPDATE public.mst_countries SET currency_code = 'AED' WHERE upper(trim(country_code)) = 'AE' AND currency_code IS NULL;
UPDATE public.mst_countries SET currency_code = 'USD' WHERE upper(trim(country_code)) = 'US' AND currency_code IS NULL;

-- ------------------------------------------------- 4. stored place of supply
ALTER TABLE public.txn_member_payments
    ADD COLUMN IF NOT EXISTS place_of_supply_country_code VARCHAR(3),
    ADD COLUMN IF NOT EXISTS place_of_supply_state_code   VARCHAR(10),
    ADD COLUMN IF NOT EXISTS hsn_sac_code                 VARCHAR(8);

ALTER TABLE public.txn_member_product_order_items
    ADD COLUMN IF NOT EXISTS place_of_supply_country_code VARCHAR(3),
    ADD COLUMN IF NOT EXISTS place_of_supply_state_code   VARCHAR(10),
    ADD COLUMN IF NOT EXISTS hsn_sac_code                 VARCHAR(8);

-- ISO codes are 2 letters; CHAR(3) would pad them ('IN '), so these are VARCHAR(3). The ALTERs
-- repair a database that ran an earlier draft of this file.
ALTER TABLE public.txn_member_payments ALTER COLUMN place_of_supply_country_code TYPE VARCHAR(3);
ALTER TABLE public.txn_member_product_order_items ALTER COLUMN place_of_supply_country_code TYPE VARCHAR(3);

-- CA override for decision 8 (CGST s.24(i)): an unregistered Indian franchise may not make
-- inter-state goods supplies unless the CA accepts the risk explicitly. mst_configs is loaded
-- when the API boots, so a change takes effect after a restart.
INSERT INTO public.mst_configs (config_name, config_value, module)
SELECT 'ALLOW_UNREGISTERED_INTERSTATE_GOODS', 'false', 'Invoice'
WHERE NOT EXISTS (SELECT 1 FROM public.mst_configs WHERE config_name = 'ALLOW_UNREGISTERED_INTERSTATE_GOODS');

-- ------------------------------------------------- 5. seeded rules
-- EFMUM: India services, GST 18%
INSERT INTO public.mst_tax_master (franchise_id, reference_id, country_code, transaction_type, tax_system, tax_code,
                                   tax_name, tax_percent, apply_on, is_tax_inclusive, tax_category, hsn_sac_code,
                                   legal_basis, effective_from, effective_to, active,
                                   created_by, modified_by, created_at, updated_at, created_ip, modified_ip)
SELECT f.franchise_id, 1, 'IN', 'SERVICE', 'GST', 'GST_18',
       'GST 18%', 18.00, 'SALE', FALSE, 'STANDARD', '999319',
       'Notif 11/2017-CT(R) heading 9993 (human health services) @ 18%, SAC 999319. Confirmed 2026-10-17 (Group 99972 @ 5% does not apply) — spec 2026-10-10-tax-mapping-matrix, decision 2.',
       DATE '2017-07-01', NULL, TRUE,
       1, 1, now(), now(), ':0', ':0'
FROM public.mst_franchises f
WHERE f.franchise_code = 'EFMUM'
  AND NOT EXISTS (SELECT 1
                  FROM public.mst_tax_master t
                  WHERE t.franchise_id = f.franchise_id
                    AND t.reference_id = 1
                    AND upper(trim(t.country_code)) = 'IN'
                    AND t.transaction_type = 'SERVICE');

-- HCUAE: UAE services, VAT 0% zero-rated (per adviser; basis to confirm)
INSERT INTO public.mst_tax_master (franchise_id, reference_id, country_code, transaction_type, tax_system, tax_code,
                                   tax_name, tax_percent, apply_on, is_tax_inclusive, tax_category, hsn_sac_code,
                                   legal_basis, effective_from, effective_to, active,
                                   created_by, modified_by, created_at, updated_at, created_ip, modified_ip)
SELECT f.franchise_id, 1, 'AE', 'SERVICE', 'VAT', 'VAT_0',
       'UAE VAT 0% (zero-rated)', 0.00, 'SALE', FALSE, 'ZERO_RATED', '999319',
       'UAE VAT Executive Regulation Art 41 (healthcare zero-rating); basis confirmed by the UAE adviser 2026-10-17 (4.6 decision 7, matrix decision 6).',
       DATE '2018-01-01', NULL, TRUE,
       1, 1, now(), now(), ':0', ':0'
FROM public.mst_franchises f
WHERE f.franchise_code = 'HCUAE'
  AND NOT EXISTS (SELECT 1
                  FROM public.mst_tax_master t
                  WHERE t.franchise_id = f.franchise_id
                    AND t.reference_id = 1
                    AND upper(trim(t.country_code)) = 'AE'
                    AND t.transaction_type = 'SERVICE');

-- MEMUM: India goods. Active NONE (unregistered) + staged inactive GST 5% per product.
INSERT INTO public.mst_tax_master (franchise_id, reference_id, country_code, transaction_type, tax_system, tax_code,
                                   tax_name, tax_percent, apply_on, is_tax_inclusive, tax_category, hsn_sac_code,
                                   legal_basis, effective_from, effective_to, active,
                                   created_by, modified_by, created_at, updated_at, created_ip, modified_ip)
SELECT f.franchise_id, p.product_id, 'IN', 'PRODUCT', 'NONE', 'NONE_0',
       'No tax (unregistered)', 0.00, 'SALE', FALSE, 'STANDARD',
       NULLIF(left(regexp_replace(p.hsn_code, '\D', '', 'g'), 8), ''),
       'Mahi Enterprise is not GST-registered (4.6 decision 18). CGST s.24(i): inter-state and export supplies need registration, so they are refused. Replace with the staged GST_5 rule once registered.',
       DATE '2017-07-01', NULL, TRUE,
       1, 1, now(), now(), ':0', ':0'
FROM public.mst_franchises f
         CROSS JOIN public.mst_product p
WHERE f.franchise_code = 'MEMUM'
  AND p.active = TRUE
  AND NOT EXISTS (SELECT 1
                  FROM public.mst_tax_master t
                  WHERE t.franchise_id = f.franchise_id
                    AND t.reference_id = p.product_id
                    AND upper(trim(t.country_code)) = 'IN'
                    AND t.transaction_type = 'PRODUCT');

INSERT INTO public.mst_tax_master (franchise_id, reference_id, country_code, transaction_type, tax_system, tax_code,
                                   tax_name, tax_percent, apply_on, is_tax_inclusive, tax_category, hsn_sac_code,
                                   legal_basis, effective_from, effective_to, active,
                                   created_by, modified_by, created_at, updated_at, created_ip, modified_ip)
SELECT f.franchise_id, p.product_id, 'IN', 'PRODUCT', 'GST', 'GST_5',
       'GST 5%', 5.00, 'SALE', FALSE, 'STANDARD',
       NULLIF(left(regexp_replace(p.hsn_code, '\D', '', 'g'), 8), ''),
       'STAGED — activate only when the debloat supplier holds a GSTIN (matrix decision 5a). Notif 9/2025-CT(R) Schedule I, effective 22 Sep 2025: HSN 3004 Ayurvedic medicaments 5% (heading confirmed 2026-10-17).',
       DATE '2025-09-22', NULL, FALSE,
       1, 1, now(), now(), ':0', ':0'
FROM public.mst_franchises f
         CROSS JOIN public.mst_product p
WHERE f.franchise_code = 'MEMUM'
  AND p.active = TRUE
  AND NOT EXISTS (SELECT 1
                  FROM public.mst_tax_master t
                  WHERE t.franchise_id = f.franchise_id
                    AND t.reference_id = p.product_id
                    AND upper(trim(t.country_code)) = 'IN'
                    AND t.transaction_type = 'PRODUCT'
                    AND t.tax_system = 'GST'
                    AND t.tax_percent = 5);

-- Production already has the EFMUM / HCUAE service rows, so the seeds above are skipped for them.
-- Fill the column this migration adds with the confirmed basis, only where nothing is set yet.
UPDATE public.mst_tax_master t
SET legal_basis = 'Notif 11/2017-CT(R) heading 9993 (human health services) @ 18%, SAC 999319. Confirmed 2026-10-17 (Group 99972 @ 5% does not apply) — spec 2026-10-10-tax-mapping-matrix, decision 2.'
FROM public.mst_franchises f
WHERE f.franchise_id = t.franchise_id
  AND f.franchise_code = 'EFMUM'
  AND t.reference_id = 1
  AND upper(trim(t.country_code)) = 'IN'
  AND t.transaction_type = 'SERVICE'
  AND t.tax_system = 'GST'
  AND t.tax_percent = 18
  AND t.legal_basis IS NULL;

UPDATE public.mst_tax_master t
SET legal_basis = 'UAE VAT Executive Regulation Art 41 (healthcare zero-rating); basis confirmed by the UAE adviser 2026-10-17 (4.6 decision 7, matrix decision 6).'
FROM public.mst_franchises f
WHERE f.franchise_id = t.franchise_id
  AND f.franchise_code = 'HCUAE'
  AND t.reference_id = 1
  AND upper(trim(t.country_code)) = 'AE'
  AND t.transaction_type = 'SERVICE'
  AND t.tax_system = 'VAT'
  AND t.tax_percent = 0
  AND t.legal_basis IS NULL;

COMMIT;
