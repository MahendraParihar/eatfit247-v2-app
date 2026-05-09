-- ============================================================================
-- 117: RBAC — Trigger, role changes, and permission matrix seed
-- PRD Reference: BR-8 (RBAC)
-- Depends on: 116_rbac_subjects_actions_tables.sql
-- ============================================================================

BEGIN;

-- --------------------------------------------------------------------------
-- 1. PostgreSQL trigger: auto-grant all permissions to roles with
--    grant_all_on_new_subject = true when a new subject is inserted
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_auto_grant_permissions_on_new_subject()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO mst_admin_role_subject_permissions
        (role_id, subject_id, action_id, created_by, modified_by, created_ip, modified_ip)
    SELECT
        r.role_id,
        NEW.subject_id,
        a.action_id,
        1,          -- system user
        1,
        '0.0.0.0',
        '0.0.0.0'
    FROM mst_admin_roles r
    CROSS JOIN mst_admin_actions a
    WHERE r.grant_all_on_new_subject = true
    ON CONFLICT (role_id, subject_id, action_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_grant_permissions_on_new_subject
    AFTER INSERT ON mst_admin_subjects
    FOR EACH ROW
    EXECUTE FUNCTION fn_auto_grant_permissions_on_new_subject();

-- --------------------------------------------------------------------------
-- 2. Rename mst_admin_role_permissions -> txn_admin_user_roles
--    This table maps admin users to roles (role assignments)
-- --------------------------------------------------------------------------
ALTER TABLE mst_admin_role_permissions RENAME TO txn_admin_user_roles;
ALTER TABLE txn_admin_user_roles RENAME COLUMN admin_role_permission_id TO admin_user_role_id;

-- Rename the primary key constraint
ALTER INDEX IF EXISTS mst_admin_role_permissions_pkey RENAME TO txn_admin_user_roles_pkey;

-- Rename existing index
ALTER INDEX IF EXISTS ix_mst_admin_role_permission_admin_id RENAME TO ix_txn_admin_user_roles_admin_id;

-- Update sequence name
ALTER SEQUENCE IF EXISTS mst_admin_role_permissions_admin_role_permission_id_seq
    RENAME TO txn_admin_user_roles_admin_user_role_id_seq;

-- --------------------------------------------------------------------------
-- 3. Role renames
-- --------------------------------------------------------------------------
UPDATE mst_admin_roles
    SET role_code = 'financial_manager', role = 'Financial Manager'
    WHERE role_code = 'account_user';

UPDATE mst_admin_roles
    SET role_code = 'product_delivery_manager', role = 'Product Delivery Manager'
    WHERE role_code = 'product_user';

-- --------------------------------------------------------------------------
-- 4. Delete BlogAdmin role (reassign users to SocialContentManager first)
-- --------------------------------------------------------------------------
UPDATE txn_admin_user_roles
    SET role_id = (SELECT role_id FROM mst_admin_roles WHERE role_code = 'social_content_manager')
    WHERE role_id = (SELECT role_id FROM mst_admin_roles WHERE role_code = 'blog_admin')
    AND admin_id NOT IN (
        -- Skip if user already has social_content_manager assignment
        SELECT admin_id FROM txn_admin_user_roles
        WHERE role_id = (SELECT role_id FROM mst_admin_roles WHERE role_code = 'social_content_manager')
    );

-- Delete any remaining duplicate assignments (user had both BlogAdmin and SocialContentManager)
DELETE FROM txn_admin_user_roles
    WHERE role_id = (SELECT role_id FROM mst_admin_roles WHERE role_code = 'blog_admin');

DELETE FROM mst_admin_roles WHERE role_code = 'blog_admin';

-- --------------------------------------------------------------------------
-- 5. Insert new AppointmentManager role
-- --------------------------------------------------------------------------
INSERT INTO mst_admin_roles (role, role_code)
    VALUES ('Appointment Manager', 'appointment_manager');

-- --------------------------------------------------------------------------
-- 6. Seed the full permission matrix
--    Translates every can() call from casl-ability.factory.ts into DB rows
--    Action IDs: 1=read, 2=create, 3=update, 4=delete
--    Manage = all 4 actions
-- --------------------------------------------------------------------------

-- Helper: create a temp table to build permissions by role_code + subject_code + action_ids
-- Then insert into the real table via joins

CREATE TEMPORARY TABLE tmp_permission_seed (
    role_code    VARCHAR(100),
    subject_code VARCHAR(100),
    action_id    INT
);

-- ===== SUPER ADMIN: all subjects x all actions =====
INSERT INTO tmp_permission_seed (role_code, subject_code, action_id)
SELECT 'super_admin', s.subject_code, a.action_id
FROM mst_admin_subjects s
CROSS JOIN mst_admin_actions a
WHERE s.active = true;

-- ===== FRANCHISE ADMIN =====
-- Dashboard: read
INSERT INTO tmp_permission_seed VALUES
    ('franchise_admin', 'Dashboard', 1);

-- Report: read, update
INSERT INTO tmp_permission_seed VALUES
    ('franchise_admin', 'Report', 1),
    ('franchise_admin', 'Report', 3);

-- Member subjects: manage (all 4)
INSERT INTO tmp_permission_seed (role_code, subject_code, action_id)
SELECT 'franchise_admin', s.subject_code, a.action_id
FROM (VALUES ('Member'), ('MemberAssessment'), ('MemberDietPlan'), ('MemberHealth'),
            ('MemberIssues'), ('MemberCallLogs'), ('MemberPayment'), ('MemberProducts'),
            ('MemberPocketGuide'), ('MemberAddress')) AS s(subject_code)
CROSS JOIN mst_admin_actions a;

-- Program: read, create, update
INSERT INTO tmp_permission_seed VALUES
    ('franchise_admin', 'Program', 1), ('franchise_admin', 'Program', 2), ('franchise_admin', 'Program', 3);

-- ProgramCategory: read, create, update
INSERT INTO tmp_permission_seed VALUES
    ('franchise_admin', 'ProgramCategory', 1), ('franchise_admin', 'ProgramCategory', 2), ('franchise_admin', 'ProgramCategory', 3);

-- ProgramPlan: read, create, update
INSERT INTO tmp_permission_seed VALUES
    ('franchise_admin', 'ProgramPlan', 1), ('franchise_admin', 'ProgramPlan', 2), ('franchise_admin', 'ProgramPlan', 3);

-- DietTemplate: read
INSERT INTO tmp_permission_seed VALUES ('franchise_admin', 'DietTemplate', 1);

-- Content read-only
INSERT INTO tmp_permission_seed VALUES
    ('franchise_admin', 'Blog', 1),
    ('franchise_admin', 'Faq', 1),
    ('franchise_admin', 'Recipe', 1),
    ('franchise_admin', 'Product', 1);

-- ProductOrder: read
INSERT INTO tmp_permission_seed VALUES ('franchise_admin', 'ProductOrder', 1);

-- Shipment: read, create, update
INSERT INTO tmp_permission_seed VALUES
    ('franchise_admin', 'Shipment', 1), ('franchise_admin', 'Shipment', 2), ('franchise_admin', 'Shipment', 3);

-- CourierProvider, CourierProviderWarehouse: read
INSERT INTO tmp_permission_seed VALUES
    ('franchise_admin', 'CourierProvider', 1),
    ('franchise_admin', 'CourierProviderWarehouse', 1);

-- PromoCode: read, create, update
INSERT INTO tmp_permission_seed VALUES
    ('franchise_admin', 'PromoCode', 1), ('franchise_admin', 'PromoCode', 2), ('franchise_admin', 'PromoCode', 3);

-- Franchise: read, create, update
INSERT INTO tmp_permission_seed VALUES
    ('franchise_admin', 'Franchise', 1), ('franchise_admin', 'Franchise', 2), ('franchise_admin', 'Franchise', 3);

-- TaxMaster: read
INSERT INTO tmp_permission_seed VALUES ('franchise_admin', 'TaxMaster', 1);

-- LovMaster: read, create, update
INSERT INTO tmp_permission_seed VALUES
    ('franchise_admin', 'LovMaster', 1), ('franchise_admin', 'LovMaster', 2), ('franchise_admin', 'LovMaster', 3);

-- Notification: manage
INSERT INTO tmp_permission_seed (role_code, subject_code, action_id)
SELECT 'franchise_admin', 'Notification', action_id FROM mst_admin_actions;

-- GoogleCalendar: manage
INSERT INTO tmp_permission_seed (role_code, subject_code, action_id)
SELECT 'franchise_admin', 'GoogleCalendar', action_id FROM mst_admin_actions;

-- AdminUser: read, create, update
INSERT INTO tmp_permission_seed VALUES
    ('franchise_admin', 'AdminUser', 1), ('franchise_admin', 'AdminUser', 2), ('franchise_admin', 'AdminUser', 3);

-- ===== NUTRITIONIST =====
-- Dashboard: read
INSERT INTO tmp_permission_seed VALUES ('nutritionist', 'Dashboard', 1);

-- Member subjects: manage (all 4)
INSERT INTO tmp_permission_seed (role_code, subject_code, action_id)
SELECT 'nutritionist', s.subject_code, a.action_id
FROM (VALUES ('Member'), ('MemberAssessment'), ('MemberDietPlan'), ('MemberHealth'),
            ('MemberIssues'), ('MemberCallLogs'), ('MemberPayment'), ('MemberProducts'),
            ('MemberPocketGuide'), ('MemberAddress')) AS s(subject_code)
CROSS JOIN mst_admin_actions a;

-- Read-only subjects
INSERT INTO tmp_permission_seed VALUES
    ('nutritionist', 'DietTemplate', 1),
    ('nutritionist', 'Program', 1),
    ('nutritionist', 'ProgramCategory', 1),
    ('nutritionist', 'ProgramPlan', 1),
    ('nutritionist', 'PocketGuide', 1),
    ('nutritionist', 'TaxMaster', 1);

-- Recipe: manage
INSERT INTO tmp_permission_seed (role_code, subject_code, action_id)
SELECT 'nutritionist', 'Recipe', action_id FROM mst_admin_actions;

-- LovMaster: read, create, update
INSERT INTO tmp_permission_seed VALUES
    ('nutritionist', 'LovMaster', 1), ('nutritionist', 'LovMaster', 2), ('nutritionist', 'LovMaster', 3);

-- GoogleCalendar: manage
INSERT INTO tmp_permission_seed (role_code, subject_code, action_id)
SELECT 'nutritionist', 'GoogleCalendar', action_id FROM mst_admin_actions;

-- ===== SOCIAL CONTENT MANAGER (includes old BlogAdmin permissions + Referrer) =====
-- Content subjects: manage (all 4)
INSERT INTO tmp_permission_seed (role_code, subject_code, action_id)
SELECT 'social_content_manager', s.subject_code, a.action_id
FROM (VALUES ('Blog'), ('BlogAuthor'), ('BlogCategory'), ('PressMedia'),
            ('SuccessStory'), ('Faq'), ('Banner'), ('SeoPage')) AS s(subject_code)
CROSS JOIN mst_admin_actions a;

-- Dashboard: read
INSERT INTO tmp_permission_seed VALUES ('social_content_manager', 'Dashboard', 1);

-- TaxMaster: read
INSERT INTO tmp_permission_seed VALUES ('social_content_manager', 'TaxMaster', 1);

-- LovMaster: manage
INSERT INTO tmp_permission_seed (role_code, subject_code, action_id)
SELECT 'social_content_manager', 'LovMaster', action_id FROM mst_admin_actions;

-- Referrer: manage
INSERT INTO tmp_permission_seed (role_code, subject_code, action_id)
SELECT 'social_content_manager', 'Referrer', action_id FROM mst_admin_actions;

-- ===== PRODUCT DELIVERY MANAGER (was product_user) =====
-- Dashboard: read
INSERT INTO tmp_permission_seed VALUES ('product_delivery_manager', 'Dashboard', 1);

-- Report: read
INSERT INTO tmp_permission_seed VALUES ('product_delivery_manager', 'Report', 1);

-- TaxMaster: read
INSERT INTO tmp_permission_seed VALUES ('product_delivery_manager', 'TaxMaster', 1);

-- LovMaster: manage
INSERT INTO tmp_permission_seed (role_code, subject_code, action_id)
SELECT 'product_delivery_manager', 'LovMaster', action_id FROM mst_admin_actions;

-- Product: read
INSERT INTO tmp_permission_seed VALUES ('product_delivery_manager', 'Product', 1);

-- ProductOrder: read, update
INSERT INTO tmp_permission_seed VALUES
    ('product_delivery_manager', 'ProductOrder', 1),
    ('product_delivery_manager', 'ProductOrder', 3);

-- Shipment: manage
INSERT INTO tmp_permission_seed (role_code, subject_code, action_id)
SELECT 'product_delivery_manager', 'Shipment', action_id FROM mst_admin_actions;

-- CourierProviderAccount: manage
INSERT INTO tmp_permission_seed (role_code, subject_code, action_id)
SELECT 'product_delivery_manager', 'CourierProviderAccount', action_id FROM mst_admin_actions;

-- CourierProvider: manage
INSERT INTO tmp_permission_seed (role_code, subject_code, action_id)
SELECT 'product_delivery_manager', 'CourierProvider', action_id FROM mst_admin_actions;

-- CourierProviderWarehouse: manage
INSERT INTO tmp_permission_seed (role_code, subject_code, action_id)
SELECT 'product_delivery_manager', 'CourierProviderWarehouse', action_id FROM mst_admin_actions;

-- PromoCode: read, create, update
INSERT INTO tmp_permission_seed VALUES
    ('product_delivery_manager', 'PromoCode', 1),
    ('product_delivery_manager', 'PromoCode', 2),
    ('product_delivery_manager', 'PromoCode', 3);

-- Member: read
INSERT INTO tmp_permission_seed VALUES ('product_delivery_manager', 'Member', 1);

-- ===== FINANCIAL MANAGER (was account_user) =====
INSERT INTO tmp_permission_seed VALUES
    ('financial_manager', 'Dashboard', 1),
    ('financial_manager', 'Report', 1),
    ('financial_manager', 'TaxMaster', 1),
    ('financial_manager', 'LovMaster', 1),
    ('financial_manager', 'MemberPayment', 1);

-- ===== APPOINTMENT MANAGER (new role) =====
-- Appointment: manage
INSERT INTO tmp_permission_seed (role_code, subject_code, action_id)
SELECT 'appointment_manager', 'Appointment', action_id FROM mst_admin_actions;

-- ContactForm: read
INSERT INTO tmp_permission_seed VALUES ('appointment_manager', 'ContactForm', 1);

-- Dashboard: read
INSERT INTO tmp_permission_seed VALUES ('appointment_manager', 'Dashboard', 1);

-- Member: read (for linking appointments to members)
INSERT INTO tmp_permission_seed VALUES ('appointment_manager', 'Member', 1);

-- ===== Now insert from temp table into real permissions table =====
INSERT INTO mst_admin_role_subject_permissions
    (role_id, subject_id, action_id, created_by, modified_by, created_ip, modified_ip)
SELECT
    r.role_id,
    s.subject_id,
    t.action_id,
    1,          -- system user
    1,
    '0.0.0.0',
    '0.0.0.0'
FROM tmp_permission_seed t
JOIN mst_admin_roles r ON r.role_code = t.role_code
JOIN mst_admin_subjects s ON s.subject_code = t.subject_code
ON CONFLICT (role_id, subject_id, action_id) DO NOTHING;

DROP TABLE tmp_permission_seed;

COMMIT;
