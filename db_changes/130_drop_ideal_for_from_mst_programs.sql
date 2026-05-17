-- =============================================================================
-- Drop ideal_for from mst_programs
-- =============================================================================
-- The ideal_for field is no longer used by admin or public surfaces.
-- All code references (backend model/service/dto, admin UI form, shared
-- interface, public web card bullets) were removed alongside this migration.
-- =============================================================================

BEGIN;

ALTER TABLE public.mst_programs
    DROP COLUMN IF EXISTS ideal_for;

COMMIT;
