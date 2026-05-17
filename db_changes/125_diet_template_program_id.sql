-- =============================================================================
-- Diet Template: optional program association
-- =============================================================================
-- Adds an optional program_id column on txn_diet_templates so a diet template
-- can be linked to a program. NULL means the template is not tied to any
-- specific program.
-- =============================================================================

BEGIN;

ALTER TABLE public.txn_diet_templates
  ADD COLUMN IF NOT EXISTS program_id INTEGER NULL
    REFERENCES public.mst_programs (program_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_txn_diet_templates_program_id
  ON public.txn_diet_templates (program_id);

COMMIT;
