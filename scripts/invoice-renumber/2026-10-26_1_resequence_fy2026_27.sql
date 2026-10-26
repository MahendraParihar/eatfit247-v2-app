-- =============================================================================
-- 2026-10-26_1_resequence_fy2026_27.sql
-- One-off: resequence EFMUM FY 2026-27 invoices issued from 1 July 2026
-- =============================================================================
-- Owner decisions, 26 Oct 2026 (needed today for the GSTR-1 filing; the code
-- ships on 27 Oct):
--   * Window: EFMUM, FY 2026-27, payment date on or after 1 July 2026 (no upper
--     bound, so it covers everything up to the run). Q1 (filed) is never touched.
--   * Series (4.7 decision 13 rule, as in the retired 138):
--       EXPORT    billing country of the payment's address snapshot is not India
--                 AND no tax was charged
--       DOMESTIC  everything else
--     DOMESTIC continues after the highest Q1 number; EXPORT starts at 1.
--     Order inside a series: payment date, created_at, primary key.
--   * Format: the compliant format of the 4.7 amendment (migration 145), so the
--     number printed is the number filed (CGST Rule 46(b), at most 16 characters):
--       EFM/2627/S/nnnnn  domestic service     EFM/2627/E/nnnnn  export service
--       EFM/2627/P/nnnnn  domestic product     EFM/2627/X/nnnnn  export product
--     Q1 keeps EFMUM/2026-27/S/000001-000202 as filed.
--   * Workshop: 3 numbers of the domestic service series are left free right
--     after the last domestic service invoice dated on or before 11 Aug 2026,
--     for the three "Gut reset programme workshop" invoices dated 11 Aug 2026
--     (spec 2026-10-26-workshop-invoice). They are recorded in
--     bkp_20261026_invoice_reserved; 2026-10-27_3_workshop_reserved.sql gives
--     them to the workshop invoices. The +3 workshop renumber script must NOT be
--     run after this.
--
-- Works on the production schema of 26 Oct 2026 (136: no mst_invoice_sequences
-- .series, no invoice_series / invoice_date). The export counters can't be
-- stored before 137, so 2026-10-27_2_after_137.sql creates them; run it right
-- after 137 and before either API starts.
--
-- DRY RUN BY DEFAULT: everything runs in one transaction and is rolled back
-- unless psql is given -v apply=1.
--   preview: psql "$DB_URL" -X -v ON_ERROR_STOP=1 -f 2026-10-26_1_resequence_fy2026_27.sql
--   apply:   psql "$DB_URL" -X -v ON_ERROR_STOP=1 -v apply=1 -f 2026-10-26_1_resequence_fy2026_27.sql
-- Any failed guard raises an exception and nothing changes. It refuses to run
-- twice (bkp_20261026_invoice_resequence exists).
--
-- Only invoice_id and the EFMUM FY 2026-27 counters change. Dates, amounts,
-- tax, status and active are not touched. PDFs are rendered on download, so
-- they print the new numbers. Emails already sent keep the old numbers; the
-- old -> new list is in bkp_20261026_invoice_resequence.
--
-- ROLLBACK (by hand, inside a transaction, before 2026-10-27_2 runs):
--   BEGIN;
--   UPDATE txn_member_payments p SET invoice_id = 'RB1026/' || p.member_payment_id
--     FROM bkp_20261026_invoice_resequence b WHERE b.source_table = 'txn_member_payments' AND b.pk = p.member_payment_id;
--   UPDATE txn_member_products m SET invoice_id = 'RB1026/' || m.member_product_id
--     FROM bkp_20261026_invoice_resequence b WHERE b.source_table = 'txn_member_products' AND b.pk = m.member_product_id;
--   UPDATE txn_member_payments p SET invoice_id = b.old_invoice_id
--     FROM bkp_20261026_invoice_resequence b WHERE b.source_table = 'txn_member_payments' AND b.pk = p.member_payment_id;
--   UPDATE txn_member_products m SET invoice_id = b.old_invoice_id
--     FROM bkp_20261026_invoice_resequence b WHERE b.source_table = 'txn_member_products' AND b.pk = m.member_product_id;
--   UPDATE mst_invoice_sequences s SET current_number = c.old_current_number
--     FROM bkp_20261026_invoice_counters c WHERE c.id = s.id;
--   COMMIT;
-- =============================================================================

\set ON_ERROR_STOP on

BEGIN;

-- ---------------------------------------------------------------- pre-guards
DO
$$
BEGIN
    IF (SELECT count(*) FROM public.mst_franchises WHERE franchise_code = 'EFMUM') <> 1 THEN
        RAISE EXCEPTION 'resequence: franchise EFMUM not found';
    END IF;
    IF to_regclass('public.bkp_20261026_invoice_resequence') IS NOT NULL THEN
        RAISE EXCEPTION 'resequence: already applied (bkp_20261026_invoice_resequence exists)';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = 'mst_invoice_sequences' AND column_name = 'series') THEN
        RAISE EXCEPTION 'resequence: 137 is already applied; this script is written for the 136 schema (run it before 137)';
    END IF;
    -- Before the workshop feature ships, no workshop invoice may hold a number
    IF to_regclass('public.txn_workshop_invoices') IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM public.txn_workshop_invoices WHERE invoice_id IS NOT NULL) THEN
            RAISE EXCEPTION 'resequence: txn_workshop_invoices already has numbered rows; decide how they fit first';
        END IF;
    END IF;
    -- Short-format numbers must not exist yet
    IF EXISTS (SELECT 1 FROM public.txn_member_payments WHERE invoice_id ~ '^EFM/2627/')
        OR EXISTS (SELECT 1 FROM public.txn_member_products WHERE invoice_id ~ '^EFM/2627/') THEN
        RAISE EXCEPTION 'resequence: EFM/2627/ numbers already exist';
    END IF;
END
$$;

LOCK TABLE public.txn_member_payments, public.txn_member_products, public.mst_invoice_sequences
    IN SHARE ROW EXCLUSIVE MODE;

-- ------------------------------------------------------------ classification
-- Every FY 2026-27 invoiced row of EFMUM, with its local payment date, resolved
-- billing country and series (same query as the retired 138).
CREATE TEMP TABLE tmp_rs_rows ON COMMIT DROP AS
WITH efmum AS (
    SELECT franchise_id, franchise_code FROM public.mst_franchises WHERE franchise_code = 'EFMUM'
),
invoiced AS (
    SELECT 'txn_member_payments'::TEXT AS source_table,
           p.member_payment_id         AS pk,
           f.franchise_id,
           'service'::TEXT             AS invoice_type,
           p.payment_date::DATE        AS local_payment_date,
           p.created_at,
           p.invoice_id,
           p.tax_amount,
           p.member_address
    FROM public.txn_member_payments p
             JOIN efmum f ON f.franchise_id = p.franchise_id
    WHERE p.invoice_id LIKE 'EFMUM/2026-27/%'
    UNION ALL
    SELECT 'txn_member_products',
           m.member_product_id,
           f.franchise_id,
           'product',
           (m.payment_date AT TIME ZONE 'Asia/Kolkata')::DATE,
           m.created_at,
           m.invoice_id,
           m.tax_amount,
           m.member_address
    FROM public.txn_member_products m
             JOIN efmum f ON f.franchise_id = m.franchise_id
    WHERE m.invoice_id LIKE 'EFMUM/2026-27/%'
),
billing AS (
    -- JSON null is not SQL NULL: only an object counts as an address
    SELECT i.*,
           CASE
               WHEN jsonb_typeof(i.member_address -> 'billingAddress') = 'object' THEN i.member_address -> 'billingAddress'
               WHEN jsonb_typeof(i.member_address -> 'address') = 'object' THEN i.member_address -> 'address'
               END AS billing_json
    FROM invoiced i
),
resolved AS (
    SELECT b.*,
           COALESCE(
                   NULLIF(upper(trim(b.billing_json ->> 'countryCode')), ''),
                   (SELECT NULLIF(upper(trim(c.country_code)), '')
                    FROM public.mst_countries c
                    WHERE c.country_id::TEXT = b.billing_json ->> 'countryId'
                    LIMIT 1),
                   (SELECT NULLIF(upper(trim(c.country_code)), '')
                    FROM public.mst_countries c
                    WHERE lower(trim(c.country)) = lower(trim(b.billing_json ->> 'country'))
                    LIMIT 1)
           ) AS billing_country
    FROM billing b
)
SELECT r.source_table,
       r.pk,
       r.franchise_id,
       r.invoice_type,
       r.local_payment_date,
       r.created_at,
       r.invoice_id                                                   AS old_invoice_id,
       substring(r.invoice_id FROM '^EFMUM/2026-27/[SP]/(\d{6})$')::INTEGER AS old_seq,
       r.tax_amount,
       r.billing_country,
       (r.local_payment_date >= DATE '2026-07-01')                    AS in_window,
       CASE
           WHEN r.billing_country IS NOT NULL AND r.billing_country <> 'IN' AND COALESCE(r.tax_amount, 0) = 0
               THEN 'EXPORT'
           ELSE 'DOMESTIC'
           END                                                        AS series
FROM resolved r;

-- -------------------------------------------------------------- data guards
DO
$$
DECLARE
    bad TEXT;
BEGIN
    -- Every number has the expected shape, and S sits on payments, P on products
    SELECT string_agg(source_table || ':' || pk || ' (' || old_invoice_id || ')', ', ')
    INTO bad
    FROM tmp_rs_rows
    WHERE old_seq IS NULL
       OR (invoice_type = 'service') <> (old_invoice_id LIKE 'EFMUM/2026-27/S/%');
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION 'resequence: unexpected FY 2026-27 invoice numbers: %', bad;
    END IF;

    -- FY 2026-27 numbers with odd casing / spaces, or on a row of another franchise
    SELECT string_agg(t.source_table || ':' || t.pk || ' (' || t.invoice_id || ')', ', ')
    INTO bad
    FROM (SELECT 'txn_member_payments'::TEXT AS source_table, member_payment_id AS pk, invoice_id
          FROM public.txn_member_payments
          WHERE upper(trim(invoice_id)) LIKE 'EFMUM/%2026-27/%'
          UNION ALL
          SELECT 'txn_member_products', member_product_id, invoice_id
          FROM public.txn_member_products
          WHERE upper(trim(invoice_id)) LIKE 'EFMUM/%2026-27/%') t
    WHERE NOT EXISTS (SELECT 1 FROM tmp_rs_rows r WHERE r.source_table = t.source_table AND r.pk = t.pk);
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION 'resequence: FY 2026-27 EFMUM numbers outside the window query (fix the franchise or the number first): %', bad;
    END IF;

    SELECT string_agg(source_table || ':' || pk || ' (' || old_invoice_id || ')', ', ')
    INTO bad
    FROM tmp_rs_rows
    WHERE local_payment_date IS NULL;
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION 'resequence: invoices without a payment date: %', bad;
    END IF;

    SELECT string_agg(source_table || ':' || pk || ' (' || old_invoice_id || ', ' || local_payment_date || ')', ', ')
    INTO bad
    FROM tmp_rs_rows
    WHERE local_payment_date >= DATE '2027-04-01' OR local_payment_date < DATE '2026-04-01';
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION 'resequence: FY 2026-27 numbers on payments dated outside FY 2026-27: %', bad;
    END IF;

    SELECT string_agg(source_table || ':' || pk || ' (' || old_invoice_id || ')', ', ')
    INTO bad
    FROM tmp_rs_rows
    WHERE in_window AND billing_country IS NULL;
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION 'resequence: billing country cannot be resolved for: %', bad;
    END IF;

    -- Q1 and Q2 numbers must not overlap, or renumbering after the Q1 maximum
    -- would leave unused numbers / move a filed Q1 invoice
    SELECT string_agg(w.source_table || ':' || w.pk || ' (' || w.old_invoice_id || ', paid ' || w.local_payment_date || ')', ', ')
    INTO bad
    FROM tmp_rs_rows w
             JOIN (SELECT invoice_type, max(old_seq) AS q1_max FROM tmp_rs_rows WHERE NOT in_window GROUP BY invoice_type) q
                  ON q.invoice_type = w.invoice_type
    WHERE w.in_window
      AND w.old_seq < q.q1_max;
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION 'resequence: Q1 and Q2 numbers overlap; Accounts must decide first. Q2 rows below the highest Q1 number: %', bad;
    END IF;

    -- No duplicate numbers today
    SELECT string_agg(old_invoice_id, ', ')
    INTO bad
    FROM (SELECT old_invoice_id FROM tmp_rs_rows GROUP BY old_invoice_id HAVING count(*) > 1) d;
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION 'resequence: duplicate invoice numbers: %', bad;
    END IF;

    -- The counter matches the highest number issued (nothing in flight, nothing lost)
    SELECT string_agg(s.invoice_type || ' counter ' || s.current_number || ' <> highest ' || COALESCE(r.hi, 0), ', ')
    INTO bad
    FROM public.mst_invoice_sequences s
             JOIN public.mst_franchises f ON f.franchise_id = s.franchise_id AND f.franchise_code = 'EFMUM'
             LEFT JOIN (SELECT invoice_type, max(old_seq) AS hi FROM tmp_rs_rows GROUP BY invoice_type) r
                       ON r.invoice_type = s.invoice_type
    WHERE s.financial_year = '2026-27'
      AND s.current_number <> COALESCE(r.hi, 0);
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION 'resequence: EFMUM FY 2026-27 counter does not match the issued numbers: %', bad;
    END IF;
END
$$;

-- -------------------------------------------------------------- Q1 snapshot
CREATE TEMP TABLE tmp_rs_q1 ON COMMIT DROP AS
SELECT count(*) AS row_count, md5(string_agg(source_table || pk || '=' || old_invoice_id, ',' ORDER BY source_table, pk)) AS checksum
FROM tmp_rs_rows
WHERE NOT in_window;

-- Highest Q1 number per type (domestic continues after it); 0 when none
CREATE TEMP TABLE tmp_rs_base ON COMMIT DROP AS
SELECT t.invoice_type,
       COALESCE((SELECT max(r.old_seq) FROM tmp_rs_rows r WHERE NOT r.in_window AND r.invoice_type = t.invoice_type), 0) AS q1_base
FROM (VALUES ('service'), ('product')) t(invoice_type);

-- ---------------------------------------------------------------- new numbers
-- Domestic service rows dated after 11 Aug 2026 move up by 3: the 3 numbers
-- after the last domestic service row dated on or before 11 Aug are the workshop
-- invoices' (owner, 26 Oct 2026).
CREATE TEMP TABLE tmp_rs_map ON COMMIT DROP AS
SELECT r.*,
       b.q1_base,
       CASE WHEN r.series = 'DOMESTIC' THEN b.q1_base ELSE 0 END
           + row_number() OVER (PARTITION BY r.invoice_type, r.series
                                ORDER BY r.local_payment_date, r.created_at, r.pk)
           + CASE
                 WHEN r.series = 'DOMESTIC' AND r.invoice_type = 'service' AND r.local_payment_date > DATE '2026-08-11'
                     THEN 3
                 ELSE 0
           END AS new_seq,
       CASE
           WHEN r.invoice_type = 'service' AND r.series = 'DOMESTIC' THEN 'S'
           WHEN r.invoice_type = 'service' THEN 'E'
           WHEN r.series = 'DOMESTIC' THEN 'P'
           ELSE 'X'
           END AS type_letter
FROM tmp_rs_rows r
         JOIN tmp_rs_base b ON b.invoice_type = r.invoice_type
WHERE r.in_window;

ALTER TABLE tmp_rs_map
    ADD COLUMN new_invoice_id TEXT;

UPDATE tmp_rs_map
SET new_invoice_id = 'EFM/2627/' || type_letter || '/' || lpad(new_seq::TEXT, 5, '0');

CREATE TEMP TABLE tmp_rs_reserved ON COMMIT DROP AS
SELECT 'EFM/2627/S/' || lpad((b.q1_base + d.n + k)::TEXT, 5, '0') AS invoice_id,
       k                                                          AS slot
FROM tmp_rs_base b
         CROSS JOIN (SELECT count(*) AS n
                     FROM tmp_rs_map
                     WHERE invoice_type = 'service' AND series = 'DOMESTIC' AND local_payment_date <= DATE '2026-08-11') d
         CROSS JOIN generate_series(1, 3) k
WHERE b.invoice_type = 'service';

-- ------------------------------------------------------------------- backups
CREATE TABLE public.bkp_20261026_invoice_resequence
(
    source_table    VARCHAR(30)  NOT NULL,
    pk              INTEGER      NOT NULL,
    franchise_id    INTEGER      NOT NULL,
    invoice_type    VARCHAR(10)  NOT NULL,
    series          VARCHAR(10)  NOT NULL,
    payment_date    DATE         NOT NULL,
    billing_country VARCHAR(5),
    tax_amount      NUMERIC(14, 3),
    old_invoice_id  VARCHAR(100) NOT NULL,
    new_invoice_id  VARCHAR(100) NOT NULL UNIQUE,
    migrated_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    PRIMARY KEY (source_table, pk)
);

INSERT INTO public.bkp_20261026_invoice_resequence
(source_table, pk, franchise_id, invoice_type, series, payment_date, billing_country, tax_amount, old_invoice_id, new_invoice_id)
SELECT source_table, pk, franchise_id, invoice_type, series, local_payment_date, billing_country, tax_amount, old_invoice_id, new_invoice_id
FROM tmp_rs_map;

-- q1_base: the highest Q1 number of the type; 2026-10-27_2 uses it to find
-- long-format numbers issued between this run and the release
CREATE TABLE public.bkp_20261026_invoice_counters AS
SELECT s.*, s.current_number AS old_current_number, b.q1_base, now() AS backed_up_at
FROM public.mst_invoice_sequences s
         JOIN public.mst_franchises f ON f.franchise_id = s.franchise_id
         JOIN tmp_rs_base b ON b.invoice_type = s.invoice_type
WHERE f.franchise_code = 'EFMUM'
  AND s.financial_year = '2026-27';

-- Numbers kept free for the 11 Aug 2026 workshop invoices
CREATE TABLE public.bkp_20261026_invoice_reserved
(
    invoice_id   VARCHAR(100) PRIMARY KEY,
    slot         SMALLINT     NOT NULL,
    purpose      TEXT         NOT NULL,
    reserved_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    used_table   VARCHAR(64),
    used_row_id  INTEGER,
    used_at      TIMESTAMPTZ
);

INSERT INTO public.bkp_20261026_invoice_reserved (invoice_id, slot, purpose)
SELECT invoice_id, slot, 'Gut reset programme workshop, 11 Aug 2026, invoice ' || slot || ' of 3'
FROM tmp_rs_reserved;

-- ------------------------------------------- phase 1: temporary unique values
-- (the unique invoice_id indexes would otherwise clash mid-update)
UPDATE public.txn_member_payments p
SET invoice_id = 'TMP1026/txn_member_payments/' || p.member_payment_id
FROM tmp_rs_map m
WHERE m.source_table = 'txn_member_payments' AND m.pk = p.member_payment_id;

UPDATE public.txn_member_products x
SET invoice_id = 'TMP1026/txn_member_products/' || x.member_product_id
FROM tmp_rs_map m
WHERE m.source_table = 'txn_member_products' AND m.pk = x.member_product_id;

-- --------------------------------------------------- phase 2: final numbers
UPDATE public.txn_member_payments p
SET invoice_id = m.new_invoice_id
FROM tmp_rs_map m
WHERE m.source_table = 'txn_member_payments' AND m.pk = p.member_payment_id;

UPDATE public.txn_member_products x
SET invoice_id = m.new_invoice_id
FROM tmp_rs_map m
WHERE m.source_table = 'txn_member_products' AND m.pk = x.member_product_id;

-- ------------------------------------------------------------------ counters
-- The 136 schema has one counter per (franchise, type, FY): it becomes the
-- DOMESTIC counter when 137 runs. Domestic service includes the 3 reserved
-- numbers. Export counters are created by 2026-10-27_2_after_137.sql.
UPDATE public.mst_invoice_sequences s
SET current_number = t.target
FROM (SELECT b.invoice_type,
             GREATEST(COALESCE(max(m.new_seq) FILTER (WHERE m.series = 'DOMESTIC'), b.q1_base),
                      CASE WHEN b.invoice_type = 'service' THEN (SELECT max(substring(invoice_id FROM '(\d{5})$')::INTEGER) FROM tmp_rs_reserved) ELSE 0 END) AS target
      FROM tmp_rs_base b
               LEFT JOIN tmp_rs_map m ON m.invoice_type = b.invoice_type
      GROUP BY b.invoice_type, b.q1_base) t,
     public.mst_franchises f
WHERE f.franchise_id = s.franchise_id
  AND f.franchise_code = 'EFMUM'
  AND s.financial_year = '2026-27'
  AND s.invoice_type = t.invoice_type;

-- -------------------------------------------------------------- post-asserts
DO
$$
DECLARE
    bad TEXT;
BEGIN
    -- Q1 unchanged
    IF (SELECT row(row_count, checksum) FROM tmp_rs_q1)
        IS DISTINCT FROM
       (SELECT row(count(*), md5(string_agg(r.source_table || r.pk || '=' || COALESCE(p.invoice_id, x.invoice_id), ','
                                            ORDER BY r.source_table, r.pk)))
        FROM tmp_rs_rows r
                 LEFT JOIN public.txn_member_payments p ON r.source_table = 'txn_member_payments' AND p.member_payment_id = r.pk
                 LEFT JOIN public.txn_member_products x ON r.source_table = 'txn_member_products' AND x.member_product_id = r.pk
        WHERE NOT r.in_window) THEN
        RAISE EXCEPTION 'resequence: Q1 invoices changed';
    END IF;

    IF EXISTS (SELECT 1 FROM public.txn_member_payments WHERE invoice_id LIKE 'TMP1026/%')
        OR EXISTS (SELECT 1 FROM public.txn_member_products WHERE invoice_id LIKE 'TMP1026/%') THEN
        RAISE EXCEPTION 'resequence: temporary invoice numbers remain';
    END IF;

    -- Every renumbered row carries its new number
    IF EXISTS (SELECT 1 FROM tmp_rs_map m
               LEFT JOIN public.txn_member_payments p ON m.source_table = 'txn_member_payments' AND p.member_payment_id = m.pk
               LEFT JOIN public.txn_member_products x ON m.source_table = 'txn_member_products' AND x.member_product_id = m.pk
               WHERE COALESCE(p.invoice_id, x.invoice_id) IS DISTINCT FROM m.new_invoice_id) THEN
        RAISE EXCEPTION 'resequence: renumbered rows do not match the mapping';
    END IF;

    -- Rule 46(b): at most 16 characters, letters, digits, / and -
    SELECT string_agg(new_invoice_id, ', ')
    INTO bad
    FROM tmp_rs_map
    WHERE new_invoice_id !~ '^[A-Za-z1-9][A-Za-z0-9/-]{0,15}$';
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION 'resequence: numbers break Rule 46(b): %', bad;
    END IF;

    -- Each series is gap-free from its start (domestic: Q1 max + 1) with no
    -- duplicates; the domestic service series counts the reserved numbers
    SELECT string_agg(invoice_type || '/' || series, ', ')
    INTO bad
    FROM (SELECT invoice_type, series, base,
                 count(*) AS n, count(DISTINCT seq) AS distinct_n, min(seq) AS lo, max(seq) AS hi
          FROM (SELECT invoice_type, series, new_seq AS seq, CASE WHEN series = 'DOMESTIC' THEN q1_base ELSE 0 END AS base
                FROM tmp_rs_map
                UNION ALL
                SELECT 'service', 'DOMESTIC', substring(r.invoice_id FROM '(\d{5})$')::INTEGER, b.q1_base
                FROM tmp_rs_reserved r
                         JOIN tmp_rs_base b ON b.invoice_type = 'service') u
          GROUP BY invoice_type, series, base) s
    WHERE n <> distinct_n OR lo <> base + 1 OR hi <> base + n;
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION 'resequence: series not contiguous: %', bad;
    END IF;

    -- Reserved numbers are free
    IF EXISTS (SELECT 1 FROM tmp_rs_reserved r JOIN public.txn_member_payments p ON p.invoice_id = r.invoice_id)
        OR EXISTS (SELECT 1 FROM tmp_rs_reserved r JOIN public.txn_member_products x ON x.invoice_id = r.invoice_id) THEN
        RAISE EXCEPTION 'resequence: a reserved workshop number is in use';
    END IF;

    -- The domestic counters equal the highest domestic number (service: incl. reserved)
    SELECT string_agg(s.invoice_type || ' ' || s.current_number, ', ')
    INTO bad
    FROM public.mst_invoice_sequences s
             JOIN public.mst_franchises f ON f.franchise_id = s.franchise_id AND f.franchise_code = 'EFMUM'
    WHERE s.financial_year = '2026-27'
      AND s.current_number <> GREATEST(
            COALESCE((SELECT max(new_seq) FROM tmp_rs_map m WHERE m.invoice_type = s.invoice_type AND m.series = 'DOMESTIC'), 0),
            COALESCE((SELECT q1_base FROM tmp_rs_base b WHERE b.invoice_type = s.invoice_type), 0),
            CASE WHEN s.invoice_type = 'service'
                     THEN (SELECT max(substring(invoice_id FROM '(\d{5})$')::INTEGER) FROM tmp_rs_reserved)
                 ELSE 0 END);
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION 'resequence: counters do not match: %', bad;
    END IF;
END
$$;

-- ------------------------------------------------------------------- report
\echo
\echo '=== Series after the run (GSTR-1 Table 13 view, 1 Jul 2026 onward) ==='
SELECT invoice_type, series, min(new_invoice_id) AS first_no, max(new_invoice_id) AS last_no, count(*) AS invoices,
       min(local_payment_date) AS first_date, max(local_payment_date) AS last_date
FROM tmp_rs_map
GROUP BY invoice_type, series
ORDER BY invoice_type, series;

\echo '=== Reserved for the 11 Aug 2026 workshop invoices ==='
SELECT slot, invoice_id FROM tmp_rs_reserved ORDER BY slot;

\echo '=== Counters (EFMUM FY 2026-27; export counters are created after 137 tomorrow) ==='
SELECT c.invoice_type, c.old_current_number, s.current_number AS new_current_number,
       (SELECT count(*) FROM tmp_rs_map m WHERE m.invoice_type = c.invoice_type AND m.series = 'EXPORT') AS export_counter_after_137
FROM bkp_20261026_invoice_counters c
         JOIN public.mst_invoice_sequences s ON s.id = c.id
ORDER BY c.invoice_type;

\echo '=== Old -> new (every renumbered invoice) ==='
SELECT source_table, pk, local_payment_date AS payment_date, billing_country, tax_amount, series, old_invoice_id, new_invoice_id
FROM tmp_rs_map
ORDER BY invoice_type, series, new_seq;

\if :{?apply}
COMMIT;
\echo 'APPLIED: committed.'
\else
ROLLBACK;
\echo 'DRY RUN: rolled back, nothing changed. Re-run with -v apply=1 to apply.'
\endif
