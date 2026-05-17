-- Add special-program scheduling fields to mst_programs.
-- These are only meaningful when is_special_program = true, but the columns
-- themselves are nullable so the constraint is enforced at the application layer.

ALTER TABLE public.mst_programs
    ADD COLUMN IF NOT EXISTS start_date DATE NULL,
    ADD COLUMN IF NOT EXISTS end_date DATE NULL,
    ADD COLUMN IF NOT EXISTS max_people_can_register INT NULL;
