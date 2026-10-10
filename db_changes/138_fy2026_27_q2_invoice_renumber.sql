-- =============================================================================
-- 138_fy2026_27_q2_invoice_renumber.sql
-- Invoice series (roadmap 4.7): one-off renumbering of FY 2026-27 from Q2
-- =============================================================================
-- Renumbers every issued invoice of the Indian franchises EFMUM and MEMUM whose
-- payment date is on or after 1 July 2026 into two series:
--
--   EXPORT    billing country (stored snapshot) is not India AND no tax was charged
--             {code}/EXP/2026-27/{S|P}/{seq}, starting at 000001
--   DOMESTIC  everything else
--             {code}/2026-27/{S|P}/{seq}, continuing after the highest Q1 number
--
-- Q1 FY 2026-27 (payment date before 1 July 2026) is filed and is never touched.
-- HCUAE and every other franchise are never touched. Rows of any status and any
-- `active` value are renumbered (an issued number keeps its place in its series).
--
-- Billing country: the snapshot's billingAddress, else its address; within that
-- address countryCode, else countryId (mst_countries), else the country name
-- (mst_countries). Same rule as InvoiceSeriesUtil / InvoiceIssueService.
-- Order inside a series: payment date, created_at, primary key.
--
-- Run AFTER 137, with public-api and admin-api STOPPED (no invoice may be issued
-- meanwhile). Preview first: scripts/invoice-renumber/preview_fy2026_27_q2.sql
-- (same classification query). The script aborts, changing nothing, if any guard
-- fails, and refuses to run twice (bkp_138_invoice_renumber exists).
--
-- -----------------------------------------------------------------------------
-- ROLLBACK (not executed; run by hand inside a transaction if ever needed, and
-- only after reviewing any invoice issued since go-live):
--
--   BEGIN;
--   UPDATE txn_member_payments p SET invoice_id = 'RB138/' || p.member_payment_id
--     FROM bkp_138_invoice_renumber b
--    WHERE b.source_table = 'txn_member_payments' AND b.pk = p.member_payment_id;
--   UPDATE txn_member_products m SET invoice_id = 'RB138/' || m.member_product_id
--     FROM bkp_138_invoice_renumber b
--    WHERE b.source_table = 'txn_member_products' AND b.pk = m.member_product_id;
--   UPDATE txn_member_payments p
--      SET invoice_id = b.old_invoice_id, invoice_series = b.old_invoice_series, invoice_date = b.old_invoice_date
--     FROM bkp_138_invoice_renumber b
--    WHERE b.source_table = 'txn_member_payments' AND b.pk = p.member_payment_id;
--   UPDATE txn_member_products m
--      SET invoice_id = b.old_invoice_id, invoice_series = b.old_invoice_series, invoice_date = b.old_invoice_date
--     FROM bkp_138_invoice_renumber b
--    WHERE b.source_table = 'txn_member_products' AND b.pk = m.member_product_id;
--   UPDATE mst_invoice_sequences s SET current_number = c.old_current_number
--     FROM bkp_138_invoice_counters c WHERE c.id = s.id;
--   UPDATE mst_invoice_sequences s SET current_number = 0
--    WHERE s.series = 'EXPORT' AND s.financial_year = '2026-27'
--      AND NOT EXISTS (SELECT 1 FROM bkp_138_invoice_counters c WHERE c.id = s.id);
--   COMMIT;
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------- pre-guards
DO
$$
BEGIN
    IF (SELECT count(*) FROM public.mst_franchises WHERE franchise_code IN ('EFMUM', 'MEMUM')) <> 2 THEN
        RAISE EXCEPTION '138: franchises EFMUM and MEMUM must both exist';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'mst_invoice_sequences' AND column_name = 'series')
        OR NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_schema = 'public' AND table_name = 'txn_member_products' AND column_name = 'invoice_series')
        OR NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_schema = 'public' AND table_name = 'mst_franchises' AND column_name = 'time_zone') THEN
        RAISE EXCEPTION '138: apply 137_invoice_series.sql first';
    END IF;
    IF to_regclass('public.bkp_138_invoice_renumber') IS NOT NULL THEN
        RAISE EXCEPTION '138: already applied (bkp_138_invoice_renumber exists)';
    END IF;
END
$$;

LOCK TABLE public.txn_member_payments, public.txn_member_products, public.mst_invoice_sequences
    IN SHARE ROW EXCLUSIVE MODE;

-- ---------------------------------------------- classification (shared query)
-- Every FY 2026-27 invoiced row of EFMUM / MEMUM with its local payment date,
-- resolved billing country, series and Q1/Q2 position. The preview script uses
-- this query verbatim (between the BEGIN/END CLASSIFICATION markers).
CREATE TEMP TABLE tmp_138_rows ON COMMIT DROP AS
-- BEGIN CLASSIFICATION
WITH franchises AS (
    SELECT franchise_id, franchise_code, time_zone
    FROM public.mst_franchises
    WHERE franchise_code IN ('EFMUM', 'MEMUM')
),
invoiced AS (
    SELECT 'txn_member_payments'::TEXT AS source_table,
           p.member_payment_id         AS pk,
           f.franchise_id,
           f.franchise_code,
           'service'::TEXT             AS invoice_type,
           'S'::TEXT                   AS type_code,
           p.payment_date::DATE        AS local_payment_date,
           p.created_at,
           p.invoice_id,
           p.invoice_series,
           p.invoice_date,
           p.tax_amount,
           p.tax_mode::TEXT            AS tax_mode,
           p.active,
           p.payment_status_id,
           p.member_id,
           p.member_address
    FROM public.txn_member_payments p
             JOIN franchises f ON f.franchise_id = p.franchise_id
    WHERE p.invoice_id IS NOT NULL
      AND (p.invoice_id LIKE f.franchise_code || '/2026-27/%' OR p.invoice_id LIKE f.franchise_code || '/EXP/2026-27/%')
    UNION ALL
    SELECT 'txn_member_products',
           m.member_product_id,
           f.franchise_id,
           f.franchise_code,
           'product',
           'P',
           (m.payment_date AT TIME ZONE f.time_zone)::DATE,
           m.created_at,
           m.invoice_id,
           m.invoice_series,
           m.invoice_date,
           m.tax_amount,
           NULL,
           m.active,
           m.payment_status_id,
           m.member_id,
           m.member_address
    FROM public.txn_member_products m
             JOIN franchises f ON f.franchise_id = m.franchise_id
    WHERE m.invoice_id IS NOT NULL
      AND (m.invoice_id LIKE f.franchise_code || '/2026-27/%' OR m.invoice_id LIKE f.franchise_code || '/EXP/2026-27/%')
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
       r.franchise_code,
       r.invoice_type,
       r.type_code,
       r.local_payment_date,
       r.created_at,
       r.invoice_id                                AS old_invoice_id,
       r.invoice_series                            AS old_invoice_series,
       r.invoice_date                              AS old_invoice_date,
       r.tax_amount,
       r.tax_mode,
       r.active,
       r.payment_status_id,
       r.member_id,
       r.billing_country,
       (r.local_payment_date >= DATE '2026-07-01') AS in_window,
       CASE
           WHEN r.billing_country IS NOT NULL AND r.billing_country <> 'IN' AND COALESCE(r.tax_amount, 0) = 0
               THEN 'EXPORT'
           ELSE 'DOMESTIC'
           END                                     AS series
FROM resolved r
-- END CLASSIFICATION
;

-- ------------------------------------------------------------- data guards
DO
$$
DECLARE
    bad TEXT;
BEGIN
    SELECT string_agg(source_table || ':' || pk || ' (' || old_invoice_id || ')', ', ')
    INTO bad
    FROM tmp_138_rows
    WHERE local_payment_date IS NULL;
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION '138: FY 2026-27 invoices without a payment date (fix them first): %', bad;
    END IF;

    SELECT string_agg(source_table || ':' || pk || ' (' || old_invoice_id || ')', ', ')
    INTO bad
    FROM tmp_138_rows
    WHERE in_window AND billing_country IS NULL;
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION '138: billing country cannot be resolved for: %', bad;
    END IF;

    SELECT string_agg(source_table || ':' || pk || ' (' || old_invoice_id || ')', ', ')
    INTO bad
    FROM tmp_138_rows
    WHERE NOT in_window AND old_invoice_id LIKE '%/EXP/%';
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION '138: export-series numbers dated before 1 July 2026: %', bad;
    END IF;
END
$$;

-- --------------------------------------------------------------- Q1 snapshot
CREATE TEMP TABLE tmp_138_q1 ON COMMIT DROP AS
SELECT source_table,
       count(*)                                                      AS row_count,
       md5(string_agg(pk || '=' || old_invoice_id, ',' ORDER BY pk)) AS checksum
FROM tmp_138_rows
WHERE NOT in_window
GROUP BY source_table;

-- Highest Q1 sequence per (franchise, type); 0 when there is none
CREATE TEMP TABLE tmp_138_base ON COMMIT DROP AS
SELECT f.franchise_id,
       t.invoice_type,
       COALESCE((SELECT max(substring(r.old_invoice_id FROM '(\d{6})$')::INTEGER)
                 FROM tmp_138_rows r
                 WHERE NOT r.in_window
                   AND r.franchise_id = f.franchise_id
                   AND r.invoice_type = t.invoice_type), 0) AS q1_base
FROM public.mst_franchises f
         CROSS JOIN (VALUES ('service'), ('product')) t(invoice_type)
WHERE f.franchise_code IN ('EFMUM', 'MEMUM');

-- ----------------------------------------------------------- new numbers
CREATE TEMP TABLE tmp_138_map ON COMMIT DROP AS
SELECT r.*,
       b.q1_base,
       CASE WHEN r.series = 'DOMESTIC' THEN b.q1_base ELSE 0 END
           + row_number() OVER (PARTITION BY r.franchise_id, r.invoice_type, r.series
                                ORDER BY r.local_payment_date, r.created_at, r.pk) AS new_seq
FROM tmp_138_rows r
         JOIN tmp_138_base b ON b.franchise_id = r.franchise_id AND b.invoice_type = r.invoice_type
WHERE r.in_window;

ALTER TABLE tmp_138_map
    ADD COLUMN new_invoice_id TEXT;

UPDATE tmp_138_map
SET new_invoice_id = franchise_code
                         || CASE WHEN series = 'EXPORT' THEN '/EXP' ELSE '' END
                         || '/2026-27/' || type_code || '/' || lpad(new_seq::TEXT, 6, '0');

-- ---------------------------------------------------------------- backups
CREATE TABLE public.bkp_138_invoice_renumber
(
    source_table       VARCHAR(30)  NOT NULL,
    pk                 INTEGER      NOT NULL,
    franchise_id       INTEGER      NOT NULL,
    invoice_type       VARCHAR(10)  NOT NULL,
    series             VARCHAR(10)  NOT NULL,
    payment_date       DATE         NOT NULL,
    billing_country    VARCHAR(5),
    tax_amount         NUMERIC(14, 3),
    old_invoice_id     VARCHAR(100) NOT NULL,
    old_invoice_series VARCHAR(10),
    old_invoice_date   DATE,
    new_invoice_id     VARCHAR(100) NOT NULL,
    migrated_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    PRIMARY KEY (source_table, pk)
);

INSERT INTO public.bkp_138_invoice_renumber
(source_table, pk, franchise_id, invoice_type, series, payment_date, billing_country, tax_amount,
 old_invoice_id, old_invoice_series, old_invoice_date, new_invoice_id)
SELECT source_table, pk, franchise_id, invoice_type, series, local_payment_date, billing_country, tax_amount,
       old_invoice_id, old_invoice_series, old_invoice_date, new_invoice_id
FROM tmp_138_map;

CREATE TABLE public.bkp_138_invoice_counters AS
SELECT s.*, s.current_number AS old_current_number, now() AS backed_up_at
FROM public.mst_invoice_sequences s
         JOIN public.mst_franchises f ON f.franchise_id = s.franchise_id
WHERE f.franchise_code IN ('EFMUM', 'MEMUM')
  AND s.financial_year = '2026-27';

-- ------------------------------------------- phase 1: temporary unique values
-- (the unique invoice_id indexes would otherwise clash mid-update)
UPDATE public.txn_member_payments p
SET invoice_id = 'TMP138/txn_member_payments/' || p.member_payment_id
FROM tmp_138_map m
WHERE m.source_table = 'txn_member_payments' AND m.pk = p.member_payment_id;

UPDATE public.txn_member_products x
SET invoice_id = 'TMP138/txn_member_products/' || x.member_product_id
FROM tmp_138_map m
WHERE m.source_table = 'txn_member_products' AND m.pk = x.member_product_id;

-- --------------------------------------------------- phase 2: final numbers
UPDATE public.txn_member_payments p
SET invoice_id     = m.new_invoice_id,
    invoice_series = m.series,
    -- What the PDF printed before 4.7; rows issued by the 4.7 code keep their date
    invoice_date   = COALESCE(p.invoice_date, m.local_payment_date)
FROM tmp_138_map m
WHERE m.source_table = 'txn_member_payments' AND m.pk = p.member_payment_id;

UPDATE public.txn_member_products x
SET invoice_id     = m.new_invoice_id,
    invoice_series = m.series,
    invoice_date   = COALESCE(x.invoice_date, m.local_payment_date)
FROM tmp_138_map m
WHERE m.source_table = 'txn_member_products' AND m.pk = x.member_product_id;

-- ---------------------------------------------------------------- counters
-- For each (franchise, type) with Q2 rows: DOMESTIC = Q1 base + domestic count,
-- EXPORT = export count. (franchise, type) pairs without Q2 rows are untouched.
WITH counts AS (
    SELECT m.franchise_id, m.invoice_type, m.q1_base,
           count(*) FILTER (WHERE m.series = 'DOMESTIC') AS domestic_count,
           count(*) FILTER (WHERE m.series = 'EXPORT')   AS export_count
    FROM tmp_138_map m
    GROUP BY m.franchise_id, m.invoice_type, m.q1_base
),
targets AS (
    SELECT franchise_id, invoice_type, 'DOMESTIC'::VARCHAR(10) AS series, q1_base + domestic_count AS target
    FROM counts
    UNION ALL
    SELECT franchise_id, invoice_type, 'EXPORT', export_count
    FROM counts
    WHERE export_count > 0
)
INSERT INTO public.mst_invoice_sequences (id, franchise_id, invoice_type, financial_year, series, current_number)
SELECT gen_random_uuid(), t.franchise_id, t.invoice_type, '2026-27', t.series, t.target
FROM targets t
ON CONFLICT (franchise_id, invoice_type, financial_year, series)
    DO UPDATE SET current_number = EXCLUDED.current_number;

-- ------------------------------------------------------------ post-asserts
DO
$$
DECLARE
    bad TEXT;
BEGIN
    -- Q1 unchanged (same rows, same numbers)
    IF EXISTS (SELECT 1
               FROM tmp_138_q1 q
                        LEFT JOIN (SELECT r.source_table,
                                          count(*) AS row_count,
                                          md5(string_agg(r.pk || '=' || COALESCE(p.invoice_id, x.invoice_id), ','
                                                         ORDER BY r.pk)) AS checksum
                                   FROM tmp_138_rows r
                                            LEFT JOIN public.txn_member_payments p
                                                      ON r.source_table = 'txn_member_payments' AND p.member_payment_id = r.pk
                                            LEFT JOIN public.txn_member_products x
                                                      ON r.source_table = 'txn_member_products' AND x.member_product_id = r.pk
                                   WHERE NOT r.in_window
                                   GROUP BY r.source_table) n ON n.source_table = q.source_table
               WHERE n.row_count IS DISTINCT FROM q.row_count
                  OR n.checksum IS DISTINCT FROM q.checksum) THEN
        RAISE EXCEPTION '138: Q1 invoices changed';
    END IF;

    IF EXISTS (SELECT 1 FROM public.txn_member_payments WHERE invoice_id LIKE 'TMP138/%')
        OR EXISTS (SELECT 1 FROM public.txn_member_products WHERE invoice_id LIKE 'TMP138/%') THEN
        RAISE EXCEPTION '138: temporary invoice numbers remain';
    END IF;

    -- Each Q2 series is contiguous (domestic base+1 .. base+n, export 1 .. n), no duplicates
    SELECT string_agg(franchise_id || '/' || invoice_type || '/' || series, ', ')
    INTO bad
    FROM (SELECT m.franchise_id, m.invoice_type, m.series,
                 count(*) AS n, count(DISTINCT m.new_seq) AS distinct_n,
                 min(m.new_seq) AS lo, max(m.new_seq) AS hi,
                 max(CASE WHEN m.series = 'DOMESTIC' THEN m.q1_base ELSE 0 END) AS base
          FROM tmp_138_map m
          GROUP BY m.franchise_id, m.invoice_type, m.series) s
    WHERE s.n <> s.distinct_n OR s.lo <> s.base + 1 OR s.hi <> s.base + s.n;
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION '138: series not contiguous: %', bad;
    END IF;

    -- Every renumbered row carries its new number and series
    IF EXISTS (SELECT 1 FROM tmp_138_map m
               JOIN public.txn_member_payments p ON m.source_table = 'txn_member_payments' AND p.member_payment_id = m.pk
               WHERE p.invoice_id <> m.new_invoice_id OR p.invoice_series <> m.series)
        OR EXISTS (SELECT 1 FROM tmp_138_map m
                   JOIN public.txn_member_products x ON m.source_table = 'txn_member_products' AND x.member_product_id = m.pk
                   WHERE x.invoice_id <> m.new_invoice_id OR x.invoice_series <> m.series) THEN
        RAISE EXCEPTION '138: renumbered rows do not match the mapping';
    END IF;

    -- Counters equal the highest number now issued in each touched series
    SELECT string_agg(s.franchise_id || '/' || s.invoice_type || '/' || s.series, ', ')
    INTO bad
    FROM public.mst_invoice_sequences s
             JOIN (SELECT franchise_id, invoice_type, series, max(new_seq) AS hi
                   FROM tmp_138_map GROUP BY franchise_id, invoice_type, series) m
                  ON m.franchise_id = s.franchise_id AND m.invoice_type = s.invoice_type AND m.series = s.series
    WHERE s.financial_year = '2026-27'
      AND s.current_number <> m.hi;
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION '138: counters do not match the renumbered series: %', bad;
    END IF;
END
$$;

COMMIT;
