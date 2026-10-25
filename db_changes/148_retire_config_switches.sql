-- =============================================================================
-- 148_retire_config_switches.sql
-- Configurable tax treatment (roadmap 4.14), plan group 7 — spec:
-- specs/features/2026-10-25-configurable-tax-treatment/requirements.md, decision 15
-- =============================================================================
-- No tax behaviour or feature switch lives in mst_configs (owner rule). Five rows
-- are retired; each now lives in the master that owns it:
--
--   ALLOW_UNREGISTERED_INTERSTATE_GOODS → the seeded MEMUM rule in Tax Master
--                                         (REFUSE, or CHARGE NONE, migration 146)
--   GST_ENABLED                          → "tax applicable" = the franchise holds an
--                                         active registration (franchise service)
--   TAX_PERCENTAGE                       → dead; rates come from Tax Master rules
--   SEND_WELCOME_MAIL / SEND_DIET_MAIL   → dead; sending is controlled by
--                                         mst_email_templates (decision 18)
--
-- mst_configs has no active flag: the API loads rows by module, so a row moved
-- to module 'Retired' is no longer loaded. Rows are never deleted. DIET_SAC_CODE
-- stays (owner, 2026-10-25): the print fallback for payments priced before 144.
--
-- Deploy: with or after the group 7 code, which no longer reads these rows. The
-- old code still boots without them (the config is a snapshot of the loaded
-- modules), but after a restart its admin payment master data answers 500:
-- GST_ENABLED then reads as an empty value, which the boolean reader refuses.
-- Idempotent: a second run changes nothing.
-- =============================================================================

BEGIN;

UPDATE public.mst_configs
SET module = 'Retired'
WHERE config_name IN ('ALLOW_UNREGISTERED_INTERSTATE_GOODS', 'GST_ENABLED', 'TAX_PERCENTAGE',
                      'SEND_WELCOME_MAIL', 'SEND_DIET_MAIL')
  AND module IS DISTINCT FROM 'Retired';

DO
$$
DECLARE
    retired INTEGER;
BEGIN
    SELECT count(*) INTO retired
    FROM public.mst_configs
    WHERE config_name IN ('ALLOW_UNREGISTERED_INTERSTATE_GOODS', 'GST_ENABLED', 'TAX_PERCENTAGE',
                          'SEND_WELCOME_MAIL', 'SEND_DIET_MAIL')
      AND module = 'Retired';
    RAISE NOTICE 'Migration 148: % of the 5 config switches are retired (a missing row has nothing to retire).', retired;
    IF NOT EXISTS (SELECT 1 FROM public.mst_configs WHERE config_name = 'DIET_SAC_CODE' AND module IS DISTINCT FROM 'Retired') THEN
        RAISE NOTICE 'Migration 148: DIET_SAC_CODE is missing or retired: payments priced before 144 print no SAC.';
    END IF;
END
$$;

COMMIT;
