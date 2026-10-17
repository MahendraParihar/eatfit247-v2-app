-- =============================================================================
-- 145_compliant_invoice_numbering.sql
-- Compliant invoice numbering (≤16 characters) and the unregistered turnover
-- warning (amends roadmap 4.7, adds to 4.11) — spec:
-- specs/features/2026-10-17-compliant-invoice-numbering/requirements.md
-- =============================================================================
-- Why 138 is retired (decision 1):
--   138 renumbered every FY 2026-27 invoice issued from 1 July 2026 into a
--   domestic and an export series, classifying the export rows from the billing
--   country and the tax charged. Without bank statements the database cannot
--   prove which Q2 foreign-client payments were foreign money, so the owner
--   decided on 2026-10-17 that no issued invoice changes: number, series, date
--   and tax stay as issued (principle 10). 138 is now a guard that refuses to
--   run. Run this file in its place.
--
--   1. mst_franchises.invoice_prefix, invoice_number_format
--      Per-franchise number format (decisions 2–5). NULL template = the legacy
--      format, so HCUAE is unchanged. Tokens: {PREFIX} {FY} {TYPE} {SEQn}; the
--      counter key and its value are unchanged, so the next number continues
--      the current sequence (EFMUM/2026-27/S/000491 → EFM/2627/S/00492).
--
--   2. mst_franchises.registration_threshold_amount, turnover_alert_fy,
--      turnover_alert_level
--      Turnover warning for franchises without a GSTIN (decision 12). The two
--      alert columns record the last level emailed in a FY (0 none, 1 amber,
--      2 red), so the daily cron emails once per level.
--
--   3. Seeds (by franchise_code, only where NULL — owner data otherwise):
--        EFMUM  EFM  {PREFIX}/{FY}/{TYPE}/{SEQ5}
--        MEMUM  MEM  {PREFIX}/{FY}/{TYPE}/{SEQ5}, threshold 4000000.00 (₹40 lakh)
--
--   4. Payment modes "Remittance via exchange house (RDA)" and
--      "Remittance app (Remitly / Wise)", routed FOREIGN_REMITTANCE (decision 10).
--
--   5. Email template admin_franchise_turnover_alert (templates/admin/
--      franchise-turnover-alert.ejs): the daily turnover cron emails super admins
--      when an unregistered franchise reaches 80% / 100% of its threshold.
--
-- Run after 137 and 139–144, with public-api and admin-api STOPPED: the first
-- invoice issued after start-up uses the new format (decision 14). Idempotent.
-- =============================================================================

BEGIN;

-- 1 + 2. Columns
ALTER TABLE public.mst_franchises
    ADD COLUMN IF NOT EXISTS invoice_prefix                VARCHAR(5),
    ADD COLUMN IF NOT EXISTS invoice_number_format         VARCHAR(40),
    ADD COLUMN IF NOT EXISTS registration_threshold_amount NUMERIC(14, 2),
    ADD COLUMN IF NOT EXISTS turnover_alert_fy             VARCHAR(10),
    ADD COLUMN IF NOT EXISTS turnover_alert_level          SMALLINT;

DO
$$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_mst_franchises_invoice_prefix') THEN
        ALTER TABLE public.mst_franchises
            ADD CONSTRAINT chk_mst_franchises_invoice_prefix
                CHECK (invoice_prefix IS NULL OR invoice_prefix ~ '^[A-Z0-9]{1,5}$');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_mst_franchises_turnover_alert_level') THEN
        ALTER TABLE public.mst_franchises
            ADD CONSTRAINT chk_mst_franchises_turnover_alert_level
                CHECK (turnover_alert_level IS NULL OR turnover_alert_level BETWEEN 0 AND 2);
    END IF;
END
$$;

-- 3. Seeds
UPDATE public.mst_franchises
SET invoice_prefix = s.invoice_prefix
FROM (VALUES ('EFMUM', 'EFM'),
             ('MEMUM', 'MEM')) AS s(franchise_code, invoice_prefix)
WHERE mst_franchises.franchise_code = s.franchise_code
  AND mst_franchises.invoice_prefix IS NULL;

UPDATE public.mst_franchises
SET invoice_number_format = '{PREFIX}/{FY}/{TYPE}/{SEQ5}'
WHERE franchise_code IN ('EFMUM', 'MEMUM')
  AND invoice_number_format IS NULL;

UPDATE public.mst_franchises
SET registration_threshold_amount = 4000000.00
WHERE franchise_code = 'MEMUM'
  AND registration_threshold_amount IS NULL;

-- 4. Remittance payment modes
INSERT INTO public.mst_payment_modes (payment_mode, payment_route, active, created_by, modified_by)
SELECT m.payment_mode, 'FOREIGN_REMITTANCE'::public.payment_route, true, 1, 1
FROM (VALUES ('Remittance via exchange house (RDA)'),
             ('Remittance app (Remitly / Wise)')) AS m(payment_mode)
WHERE NOT EXISTS (SELECT 1 FROM public.mst_payment_modes p WHERE lower(p.payment_mode) = lower(m.payment_mode));

-- 5. Turnover warning email
INSERT INTO public.mst_email_templates
    (template_name, subject, email_template_file, whatspp_template_file,
     send_email_notification, send_whatsapp_notification, active, created_by, modified_by)
SELECT 'admin_franchise_turnover_alert',
       'GST registration threshold: {{franchiseName}} at {{percent}}%',
       'admin/franchise-turnover-alert',
       NULL,
       true, false, true, 1, 1
WHERE NOT EXISTS (
    SELECT 1 FROM public.mst_email_templates WHERE template_name = 'admin_franchise_turnover_alert'
);

COMMIT;
