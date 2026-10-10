-- =============================================================================
-- 137_invoice_series.sql
-- Invoice series and proforma (roadmap 4.7), schema only
-- =============================================================================
--   1. mst_invoice_sequences.series
--      DOMESTIC | EXPORT. Indian franchises number exports in their own series
--      ({code}/EXP/{FY}/{S|P}/{seq}). Existing counters become DOMESTIC with no
--      data change. The unique key gains the series.
--
--   2. invoice_series + invoice_date on txn_member_payments / txn_member_products
--      Set when the invoice number is issued. invoice_date is the date of issue
--      in the franchise's timezone; the FY in the number comes from it. NULL on
--      rows issued before this migration (Q1 FY 2026-27 and earlier); 138 fills
--      them for the Q2 renumbering window.
--
--   3. mst_franchises.time_zone
--      IANA zone used for invoice_date and gateway payment dates.
--
-- Idempotent: safe to run twice. 138 (data) runs after this file.
-- =============================================================================

BEGIN;

ALTER TABLE public.mst_invoice_sequences
    ADD COLUMN IF NOT EXISTS series VARCHAR(10) NOT NULL DEFAULT 'DOMESTIC';

DO
$$
BEGIN
    IF NOT EXISTS (SELECT 1
                   FROM pg_constraint
                   WHERE conname = 'chk_mst_invoice_sequences_series') THEN
        ALTER TABLE public.mst_invoice_sequences
            ADD CONSTRAINT chk_mst_invoice_sequences_series CHECK (series IN ('DOMESTIC', 'EXPORT'));
    END IF;
END
$$;

-- 108 created the (franchise_id, invoice_type, financial_year) unique key inline,
-- so its name is generated. Drop whichever unique constraint covers exactly those
-- three columns, then add the named four-column key.
DO
$$
DECLARE
    old_name TEXT;
BEGIN
    SELECT c.conname
    INTO old_name
    FROM pg_constraint c
    WHERE c.conrelid = 'public.mst_invoice_sequences'::regclass
      AND c.contype = 'u'
      AND (SELECT array_agg(a.attname::TEXT ORDER BY a.attname)
           FROM unnest(c.conkey) k(attnum)
                    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum)
        = ARRAY ['financial_year', 'franchise_id', 'invoice_type'];

    IF old_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.mst_invoice_sequences DROP CONSTRAINT %I', old_name);
    END IF;

    IF NOT EXISTS (SELECT 1
                   FROM pg_constraint
                   WHERE conname = 'uq_mst_invoice_sequences_franchise_type_year_series') THEN
        ALTER TABLE public.mst_invoice_sequences
            ADD CONSTRAINT uq_mst_invoice_sequences_franchise_type_year_series
                UNIQUE (franchise_id, invoice_type, financial_year, series);
    END IF;
END
$$;

ALTER TABLE public.txn_member_payments
    ADD COLUMN IF NOT EXISTS invoice_series VARCHAR(10),
    ADD COLUMN IF NOT EXISTS invoice_date   DATE;

ALTER TABLE public.txn_member_products
    ADD COLUMN IF NOT EXISTS invoice_series VARCHAR(10),
    ADD COLUMN IF NOT EXISTS invoice_date   DATE;

DO
$$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_txn_member_payments_invoice_series') THEN
        ALTER TABLE public.txn_member_payments
            ADD CONSTRAINT chk_txn_member_payments_invoice_series
                CHECK (invoice_series IS NULL OR invoice_series IN ('DOMESTIC', 'EXPORT'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_txn_member_products_invoice_series') THEN
        ALTER TABLE public.txn_member_products
            ADD CONSTRAINT chk_txn_member_products_invoice_series
                CHECK (invoice_series IS NULL OR invoice_series IN ('DOMESTIC', 'EXPORT'));
    END IF;
END
$$;

ALTER TABLE public.mst_franchises
    ADD COLUMN IF NOT EXISTS time_zone VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata';

UPDATE public.mst_franchises
SET time_zone = 'Asia/Dubai'
WHERE franchise_code = 'HCUAE'
  AND time_zone <> 'Asia/Dubai';

COMMIT;
