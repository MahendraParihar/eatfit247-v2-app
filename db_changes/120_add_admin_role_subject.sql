-- ============================================================================
-- 120: Add AdminRole subject for RBAC management screens
-- PRD Reference: BR-8 (RBAC)
-- ============================================================================

BEGIN;

-- Insert AdminRole subject (global, not franchise-scoped)
-- The AFTER INSERT trigger on mst_admin_subjects will automatically grant
-- all 4 actions to roles with grant_all_on_new_subject = true (Super Admin).
INSERT INTO mst_admin_subjects (subject_code, subject_name, franchise_scoped)
VALUES ('AdminRole', 'Admin Roles', false)
ON CONFLICT (subject_code) DO NOTHING;

COMMIT;
