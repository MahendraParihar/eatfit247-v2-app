-- Tag a seasonal program to its program plan.
-- The relationship is optional (NULL allowed) and applies only when
-- is_special_program = true; enforced at the application layer.
-- ON DELETE SET NULL so soft-deleting/hard-deleting a plan never cascades to programs.

ALTER TABLE public.mst_programs
    ADD COLUMN IF NOT EXISTS program_plan_id INT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_mst_programs_program_plan'
          AND table_name = 'mst_programs'
    ) THEN
        ALTER TABLE public.mst_programs
            ADD CONSTRAINT fk_mst_programs_program_plan
            FOREIGN KEY (program_plan_id)
            REFERENCES public.mst_program_plans(program_plan_id)
            ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_mst_programs_program_plan_id
    ON public.mst_programs(program_plan_id);
