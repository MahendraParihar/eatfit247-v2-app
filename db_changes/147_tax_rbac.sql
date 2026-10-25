-- =============================================================================
-- 147_tax_rbac.sql
-- Configurable tax treatment (roadmap 4.14), plan group 3 — spec:
-- specs/features/2026-10-25-configurable-tax-treatment/requirements.md, decision 14
-- =============================================================================
--   1. TaxMaster becomes franchise-scoped. The services filter rules and
--      registrations to the admin's franchises and refuse writes to another
--      franchise (403); the guard checks only action and subject.
--
--   2. franchise_admin gets Create / Update on TaxMaster (their own franchises
--      only, enforced in the service). Other roles keep their Read.
--
--   3. New subjects (ON CONFLICT DO NOTHING; the subject trigger grants them to
--      roles with grant_all_on_new_subject, i.e. Super Admin):
--        TaxEvidence    franchise-scoped: the finance decision on a zero-rating
--                       evidence mismatch (decision 9)
--        EmailTemplate  global: the Email Templates on/off switches (decision 18)
--
--   4. financial_manager gets Read / Update on TaxEvidence (explicit grant).
--
-- The grants run only on the first run (marker: TaxMaster not yet
-- franchise-scoped). The RBAC screen saves a role by deleting its rows and
-- inserting the ticked ones, so an unticked grant has no row: a re-run that
-- inserted again would switch it back on.
-- Idempotent: safe to run twice.
-- =============================================================================

BEGIN;

-- 3. New subjects
INSERT INTO public.mst_admin_subjects (subject_code, subject_name, franchise_scoped)
VALUES ('TaxEvidence', 'Tax evidence decisions', TRUE),
       ('EmailTemplate', 'Email templates', FALSE)
ON CONFLICT (subject_code) DO NOTHING;

DO
$$
BEGIN
    -- First run only: TaxMaster is not franchise-scoped yet
    IF EXISTS (SELECT 1 FROM public.mst_admin_subjects WHERE subject_code = 'TaxMaster' AND NOT franchise_scoped) THEN
        -- 2 + 4. Explicit grants
        INSERT INTO public.mst_admin_role_subject_permissions (role_id, subject_id, action_id,
                                                               created_by, modified_by, created_ip, modified_ip)
        SELECT r.role_id, s.subject_id, a.action_id, 1, 1, '0.0.0.0', '0.0.0.0'
        FROM (VALUES ('franchise_admin', 'TaxMaster', 'create'),
                     ('franchise_admin', 'TaxMaster', 'update'),
                     ('financial_manager', 'TaxEvidence', 'read'),
                     ('financial_manager', 'TaxEvidence', 'update')) AS g(role_code, subject_code, action_code)
                 JOIN public.mst_admin_roles r ON r.role_code = g.role_code
                 JOIN public.mst_admin_subjects s ON s.subject_code = g.subject_code
                 JOIN public.mst_admin_actions a ON a.action_code = g.action_code
        ON CONFLICT (role_id, subject_id, action_id) DO NOTHING;

        -- 1. TaxMaster is franchise-scoped (also the marker that this ran)
        UPDATE public.mst_admin_subjects
        SET franchise_scoped = TRUE
        WHERE subject_code = 'TaxMaster';
    END IF;
END
$$;

COMMIT;
