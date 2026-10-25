-- ============================================================================
-- LOCAL DEV ONLY — never run on production. Not a migration (lives outside db_changes/).
-- Test admin users for checking role behaviour (pocket-guide validation A1, A6, A11).
-- Idempotent: re-running updates the same rows (matched on email).
--
-- Login (all users): password QaTest-26471eb81ee6!7
--   qa.franchise.admin@eatfit247.test   franchise_admin          franchise 1 (EAT FIT 247)
--   qa.social@eatfit247.test            social_content_manager   (no PocketGuide permission)
--   qa.nutritionist.f2@eatfit247.test   nutritionist             franchise 2 only (cross-franchise checks)
--   qa.super.admin@eatfit247.test       super_admin              unscoped (API checks without a personal login)
--
-- Remove: deactivate with  UPDATE mst_admin_users SET active = false WHERE email_id LIKE 'qa.%@eatfit247.test';
-- ============================================================================

BEGIN;

WITH users(first_name, last_name, email_id, contact_number, franchise_id, role_code) AS (
    VALUES
        ('QA', 'Franchise Admin', 'qa.franchise.admin@eatfit247.test', '9990000101', 1, 'franchise_admin'),
        ('QA', 'Social Content',  'qa.social@eatfit247.test',          '9990000102', NULL::integer, 'social_content_manager'),
        ('QA', 'Nutritionist F2', 'qa.nutritionist.f2@eatfit247.test', '9990000103', 2, 'nutritionist'),
        ('QA', 'Super Admin',     'qa.super.admin@eatfit247.test',     '9990000104', NULL::integer, 'super_admin')
),
upserted AS (
    INSERT INTO mst_admin_users
        (first_name, last_name, password, country_code, contact_number, email_id, start_date,
         franchise_id, created_by, modified_by, created_ip, modified_ip, active)
    SELECT u.first_name, u.last_name, '$2b$12$SeE1KR5bydFCcoqsVY0ofOnMPGlZB6mJBw8N8ouXy5RK8p27U.KrO', '+91', u.contact_number, u.email_id, CURRENT_TIMESTAMP,
           u.franchise_id, 1, 1, '127.0.0.1', '127.0.0.1', true
    FROM users u
    WHERE NOT EXISTS (SELECT 1 FROM mst_admin_users a WHERE a.email_id = u.email_id)
    RETURNING admin_id, email_id
)
SELECT count(*) AS created FROM upserted;

-- Keep password / franchise / active in sync on re-run
UPDATE mst_admin_users a
SET password = '$2b$12$SeE1KR5bydFCcoqsVY0ofOnMPGlZB6mJBw8N8ouXy5RK8p27U.KrO', active = true, franchise_id = v.franchise_id, updated_at = CURRENT_TIMESTAMP
FROM (VALUES ('qa.franchise.admin@eatfit247.test', 1), ('qa.social@eatfit247.test', NULL::integer),
             ('qa.nutritionist.f2@eatfit247.test', 2), ('qa.super.admin@eatfit247.test', NULL::integer)) AS v(email_id, franchise_id)
WHERE a.email_id = v.email_id;

INSERT INTO txn_admin_user_roles (role_id, admin_id, active, created_by, modified_by, created_ip, modified_ip)
SELECT r.role_id, a.admin_id, true, 1, 1, '127.0.0.1', '127.0.0.1'
FROM (VALUES ('qa.franchise.admin@eatfit247.test', 'franchise_admin'),
             ('qa.social@eatfit247.test', 'social_content_manager'),
             ('qa.nutritionist.f2@eatfit247.test', 'nutritionist'),
             ('qa.super.admin@eatfit247.test', 'super_admin')) AS v(email_id, role_code)
JOIN mst_admin_users a ON a.email_id = v.email_id
JOIN mst_admin_roles r ON r.role_code = v.role_code
WHERE NOT EXISTS (SELECT 1 FROM txn_admin_user_roles x WHERE x.admin_id = a.admin_id AND x.role_id = r.role_id);

INSERT INTO txn_admin_franchises (admin_id, franchise_id, created_by, modified_by, created_ip, modified_ip)
SELECT a.admin_id, v.franchise_id, 1, 1, '127.0.0.1', '127.0.0.1'
FROM (VALUES ('qa.franchise.admin@eatfit247.test', 1), ('qa.nutritionist.f2@eatfit247.test', 2)) AS v(email_id, franchise_id)
JOIN mst_admin_users a ON a.email_id = v.email_id
ON CONFLICT (admin_id, franchise_id) DO NOTHING;

SELECT a.admin_id, a.email_id, r.role_code, a.franchise_id,
       (SELECT string_agg(f.franchise_id::text, ',') FROM txn_admin_franchises f WHERE f.admin_id = a.admin_id) AS franchises
FROM mst_admin_users a
JOIN txn_admin_user_roles ur ON ur.admin_id = a.admin_id
JOIN mst_admin_roles r ON r.role_id = ur.role_id
WHERE a.email_id LIKE 'qa.%@eatfit247.test'
ORDER BY a.admin_id;

COMMIT;
