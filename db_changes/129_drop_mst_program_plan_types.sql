-- =============================================================================
-- Drop mst_program_plan_types
-- =============================================================================
-- The program_plan_type concept (Regular/Seasonal) is not value-adding:
-- "seasonal" is already captured by mst_programs.is_special_program, and
-- no other domain logic depends on the type label. Removing it entirely:
--   1. mst_program_plans.program_plan_type_id FK column
--   2. mst_program_plan_types table
-- All code references (backend model/service/controller/dto, admin UI pages,
-- shared interfaces) were removed alongside this migration.
-- =============================================================================

BEGIN;

ALTER TABLE public.mst_program_plans
    DROP CONSTRAINT IF EXISTS fk_mst_program_plan_mst_program_plan_type_p_p_t_id;

ALTER TABLE public.mst_program_plans
    DROP COLUMN IF EXISTS program_plan_type_id;

DROP TABLE IF EXISTS public.mst_program_plan_types CASCADE;

COMMIT;
