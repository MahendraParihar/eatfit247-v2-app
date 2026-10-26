-- =============================================================================
-- 2026-10-27_2_after_137.sql
-- Release step for the 26 Oct 2026 resequencing: run right AFTER
-- db_changes/137_invoice_series.sql and BEFORE either API starts.
-- =============================================================================
-- 2026-10-26_1_resequence_fy2026_27.sql ran on the 136 schema, which has no
-- series. Now that 137 has added it, this script:
--   1. converts any EFMUM FY 2026-27 number the old code issued between that
--      run and this release (EFMUM/2026-27/S/000431 -> EFM/2627/S/00431; same
--      counter value, so no gap). They are listed in the output.
--   2. sets invoice_series and invoice_date on every resequenced row (the edit
--      guard and the documents-issued report read them).
--   3. creates the EXPORT counters at the highest export number. Without this
--      the first new export would be numbered EFM/2627/E/00001 again.
--
-- DRY RUN BY DEFAULT (rolled back); add -v apply=1 to commit.
--   psql "$DB_URL" -X -v ON_ERROR_STOP=1 [-v apply=1] -f 2026-10-27_2_after_137.sql
-- Safe to run twice.
-- =============================================================================

\set ON_ERROR_STOP on

BEGIN;

DO
$$
BEGIN
    IF to_regclass('public.bkp_20261026_invoice_resequence') IS NULL
        OR to_regclass('public.bkp_20261026_invoice_counters') IS NULL THEN
        RAISE EXCEPTION 'after_137: run 2026-10-26_1_resequence_fy2026_27.sql (with apply) first';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'mst_invoice_sequences' AND column_name = 'series')
        OR NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_schema = 'public' AND table_name = 'txn_member_payments' AND column_name = 'invoice_series') THEN
        RAISE EXCEPTION 'after_137: apply db_changes/137_invoice_series.sql first';
    END IF;
END
$$;

LOCK TABLE public.txn_member_payments, public.txn_member_products, public.mst_invoice_sequences
    IN SHARE ROW EXCLUSIVE MODE;

-- ------------------------------------- 1. long-format numbers issued since the run
CREATE TEMP TABLE tmp_a137_late ON COMMIT DROP AS
SELECT x.source_table, x.pk, x.invoice_id AS old_invoice_id, x.local_payment_date,
       'EFM/2627/' || CASE WHEN x.invoice_type = 'service' THEN 'S' ELSE 'P' END || '/'
           || lpad(substring(x.invoice_id FROM '(\d{6})$')::INTEGER::TEXT, 5, '0') AS new_invoice_id
FROM (SELECT 'txn_member_payments'::TEXT AS source_table, p.member_payment_id AS pk, p.invoice_id, 'service'::TEXT AS invoice_type,
             p.payment_date::DATE AS local_payment_date
      FROM public.txn_member_payments p
      WHERE p.invoice_id ~ '^EFMUM/2026-27/S/\d{6}$'
      UNION ALL
      SELECT 'txn_member_products', m.member_product_id, m.invoice_id, 'product',
             (m.payment_date AT TIME ZONE 'Asia/Kolkata')::DATE
      FROM public.txn_member_products m
      WHERE m.invoice_id ~ '^EFMUM/2026-27/P/\d{6}$') x
         JOIN public.bkp_20261026_invoice_counters c ON c.invoice_type = x.invoice_type
WHERE substring(x.invoice_id FROM '(\d{6})$')::INTEGER > c.q1_base;

-- A long-format number dated from 1 July that is not caught above (e.g. a first
-- EFMUM product invoice, which had no counter on 26 Oct) needs a decision
DO
$$
DECLARE
    bad TEXT;
BEGIN
    SELECT string_agg(x.source_table || ':' || x.pk || ' (' || x.invoice_id || ')', ', ')
    INTO bad
    FROM (SELECT 'txn_member_payments'::TEXT AS source_table, member_payment_id AS pk, invoice_id, payment_date::DATE AS d
          FROM public.txn_member_payments
          WHERE upper(trim(invoice_id)) LIKE 'EFMUM/%2026-27/%'
          UNION ALL
          SELECT 'txn_member_products', member_product_id, invoice_id, (payment_date AT TIME ZONE 'Asia/Kolkata')::DATE
          FROM public.txn_member_products
          WHERE upper(trim(invoice_id)) LIKE 'EFMUM/%2026-27/%') x
    WHERE x.d >= DATE '2026-07-01'
      AND NOT EXISTS (SELECT 1 FROM tmp_a137_late l WHERE l.source_table = x.source_table AND l.pk = x.pk);
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION 'after_137: long-format numbers dated from 1 Jul 2026 that this script cannot convert: %', bad;
    END IF;
END
$$;

\echo '=== Long-format numbers issued after the 26 Oct run (converted; tell Accounts) ==='
SELECT * FROM tmp_a137_late ORDER BY new_invoice_id;

UPDATE public.txn_member_payments p
SET invoice_id     = l.new_invoice_id,
    invoice_series = 'DOMESTIC',
    invoice_date   = COALESCE(p.invoice_date, l.local_payment_date)
FROM tmp_a137_late l
WHERE l.source_table = 'txn_member_payments' AND l.pk = p.member_payment_id;

UPDATE public.txn_member_products m
SET invoice_id     = l.new_invoice_id,
    invoice_series = 'DOMESTIC',
    invoice_date   = COALESCE(m.invoice_date, l.local_payment_date)
FROM tmp_a137_late l
WHERE l.source_table = 'txn_member_products' AND l.pk = m.member_product_id;

-- ------------------------------------------------ 2. series and date of each row
-- invoice_date = the payment date the PDF printed before 4.7
UPDATE public.txn_member_payments p
SET invoice_series = b.series,
    invoice_date   = COALESCE(p.invoice_date, b.payment_date)
FROM public.bkp_20261026_invoice_resequence b
WHERE b.source_table = 'txn_member_payments' AND b.pk = p.member_payment_id
  AND p.invoice_id = b.new_invoice_id
  AND (p.invoice_series IS DISTINCT FROM b.series OR p.invoice_date IS NULL);

UPDATE public.txn_member_products m
SET invoice_series = b.series,
    invoice_date   = COALESCE(m.invoice_date, b.payment_date)
FROM public.bkp_20261026_invoice_resequence b
WHERE b.source_table = 'txn_member_products' AND b.pk = m.member_product_id
  AND m.invoice_id = b.new_invoice_id
  AND (m.invoice_series IS DISTINCT FROM b.series OR m.invoice_date IS NULL);

-- ------------------------------------------------------------ 3. export counters
INSERT INTO public.mst_invoice_sequences (id, franchise_id, invoice_type, financial_year, series, current_number)
SELECT gen_random_uuid(), b.franchise_id, b.invoice_type, '2026-27', 'EXPORT',
       max(substring(b.new_invoice_id FROM '(\d{5})$')::INTEGER)
FROM public.bkp_20261026_invoice_resequence b
WHERE b.series = 'EXPORT'
GROUP BY b.franchise_id, b.invoice_type
ON CONFLICT (franchise_id, invoice_type, financial_year, series)
    DO UPDATE SET current_number = GREATEST(mst_invoice_sequences.current_number, EXCLUDED.current_number);

-- ------------------------------------------------------------------ post-asserts
DO
$$
DECLARE
    bad TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM public.bkp_20261026_invoice_resequence b
               LEFT JOIN public.txn_member_payments p ON b.source_table = 'txn_member_payments' AND p.member_payment_id = b.pk
               LEFT JOIN public.txn_member_products m ON b.source_table = 'txn_member_products' AND m.member_product_id = b.pk
               WHERE COALESCE(p.invoice_id, m.invoice_id) IS DISTINCT FROM b.new_invoice_id
                  OR COALESCE(p.invoice_series, m.invoice_series) IS DISTINCT FROM b.series
                  OR COALESCE(p.invoice_date, m.invoice_date) IS NULL) THEN
        RAISE EXCEPTION 'after_137: resequenced rows changed since the 26 Oct run, or lack series / date';
    END IF;

    -- Every EFM/2627 number is at or below its series counter, and each counter
    -- equals the highest number of its series (service domestic incl. reserved)
    SELECT string_agg(s.invoice_type || '/' || s.series || ' counter ' || s.current_number || ' vs highest ' || COALESCE(n.hi, 0), ', ')
    INTO bad
    FROM public.mst_invoice_sequences s
             JOIN public.mst_franchises f ON f.franchise_id = s.franchise_id AND f.franchise_code = 'EFMUM'
             LEFT JOIN (SELECT CASE WHEN t IN ('S', 'E') THEN 'service' ELSE 'product' END AS invoice_type,
                               CASE WHEN t IN ('S', 'P') THEN 'DOMESTIC' ELSE 'EXPORT' END AS series,
                               max(seq) AS hi
                        FROM (SELECT substring(invoice_id FROM '^EFM/2627/([SEPX])/') AS t,
                                     substring(invoice_id FROM '(\d{5})$')::INTEGER AS seq
                              FROM (SELECT invoice_id FROM public.txn_member_payments
                                    UNION ALL SELECT invoice_id FROM public.txn_member_products
                                    UNION ALL SELECT invoice_id FROM public.bkp_20261026_invoice_reserved) a
                              WHERE invoice_id ~ '^EFM/2627/[SEPX]/\d{5}$') z
                        GROUP BY 1, 2) n ON n.invoice_type = s.invoice_type AND n.series = s.series
    WHERE s.financial_year = '2026-27'
      AND s.current_number <> COALESCE(n.hi, s.current_number);
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION 'after_137: counters do not match the issued numbers: %', bad;
    END IF;
END
$$;

\echo '=== EFMUM FY 2026-27 counters ==='
SELECT s.invoice_type, s.series, s.current_number
FROM public.mst_invoice_sequences s
         JOIN public.mst_franchises f ON f.franchise_id = s.franchise_id AND f.franchise_code = 'EFMUM'
WHERE s.financial_year = '2026-27'
ORDER BY 1, 2;

\if :{?apply}
COMMIT;
\echo 'APPLIED: committed.'
\else
ROLLBACK;
\echo 'DRY RUN: rolled back, nothing changed. Re-run with -v apply=1 to apply.'
\endif
