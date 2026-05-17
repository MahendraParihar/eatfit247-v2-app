-- =============================================================================
-- Drop Program Categories
-- =============================================================================
-- Removes the program_category concept entirely:
--   1. RBAC permissions + subject row for 'ProgramCategory'
--   2. program_category_id FK column on mst_programs
--   3. mst_program_categories table
-- All code references (backend service/controller/model, admin UI pages, shared
-- interfaces, CASL abilities) were removed alongside this migration.
-- =============================================================================

BEGIN;

-- 1. RBAC cleanup: remove role permissions and subject definition
DELETE FROM mst_admin_role_subject_permissions
WHERE subject_id IN (
    SELECT subject_id FROM mst_admin_subjects WHERE subject_code = 'ProgramCategory'
);

DELETE FROM mst_admin_subjects WHERE subject_code = 'ProgramCategory';

-- 2. Drop the FK column from mst_programs
ALTER TABLE public.mst_programs DROP COLUMN IF EXISTS program_category_id;

-- 3. Drop the master table
DROP TABLE IF EXISTS public.mst_program_categories CASCADE;

COMMIT;
