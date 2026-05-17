-- ============================================================================
-- 119: Seed permission matrix for appointment-related roles
-- PRD Reference: BR-10 (Appointment Management)
-- Depends on: 117 (appointment_manager role exists), 116 (Appointment subject exists)
-- ============================================================================

BEGIN;

-- Appointment Manager: Appointment (CRUD), ContactForm (read), Dashboard (read), Member (read)
-- Already seeded in 117_rbac_trigger_role_changes.sql

-- Nutritionist: add Appointment (read) — view own appointments
INSERT INTO mst_admin_role_subject_permissions
    (role_id, subject_id, action_id, created_by, modified_by, created_ip, modified_ip)
SELECT
    r.role_id,
    s.subject_id,
    a.action_id,
    1, 1, '0.0.0.0', '0.0.0.0'
FROM mst_admin_roles r
CROSS JOIN mst_admin_subjects s
CROSS JOIN mst_admin_actions a
WHERE r.role_code = 'nutritionist'
  AND s.subject_code = 'Appointment'
  AND a.action_code = 'read'
ON CONFLICT (role_id, subject_id, action_id) DO NOTHING;

-- Franchise Admin: add Appointment (CRUD) — manage franchise appointments
INSERT INTO mst_admin_role_subject_permissions
    (role_id, subject_id, action_id, created_by, modified_by, created_ip, modified_ip)
SELECT
    r.role_id,
    s.subject_id,
    a.action_id,
    1, 1, '0.0.0.0', '0.0.0.0'
FROM mst_admin_roles r
CROSS JOIN mst_admin_subjects s
CROSS JOIN mst_admin_actions a
WHERE r.role_code = 'franchise_admin'
  AND s.subject_code = 'Appointment'
ON CONFLICT (role_id, subject_id, action_id) DO NOTHING;

COMMIT;
