-- ============================================================================
-- 116: RBAC — New tables for database-driven permissions
-- PRD Reference: BR-8 (RBAC)
-- ============================================================================

BEGIN;

-- --------------------------------------------------------------------------
-- 1. mst_admin_subjects — all protectable resources
--    Developer-managed via migrations only (not editable from admin UI)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mst_admin_subjects (
    subject_id    SERIAL PRIMARY KEY,
    subject_code  VARCHAR(100) NOT NULL UNIQUE,
    subject_name  VARCHAR(100) NOT NULL,
    franchise_scoped BOOLEAN NOT NULL DEFAULT false,
    active        BOOLEAN NOT NULL DEFAULT true,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed subjects from AdminSubjectEnum (excluding 'All' which is CASL-only wildcard)
-- franchise_scoped determined by current casl-ability.factory.ts scope() usage

-- Member domain (all franchise-scoped)
INSERT INTO mst_admin_subjects (subject_code, subject_name, franchise_scoped) VALUES
    ('Member',           'Member',              true),
    ('MemberAssessment', 'Member Assessment',   true),
    ('MemberDietPlan',   'Member Diet Plan',    true),
    ('MemberHealth',     'Member Health',       true),
    ('MemberIssues',     'Member Issues',       true),
    ('MemberCallLogs',   'Member Call Logs',    true),
    ('MemberPayment',    'Member Payment',      true),
    ('MemberProducts',   'Member Products',     true),
    ('MemberPocketGuide','Member Pocket Guide', true),
    ('MemberAddress',    'Member Address',      true);

-- Content domain (all global)
INSERT INTO mst_admin_subjects (subject_code, subject_name, franchise_scoped) VALUES
    ('Blog',         'Blog',          false),
    ('BlogAuthor',   'Blog Author',   false),
    ('BlogCategory', 'Blog Category', false),
    ('Recipe',       'Recipe',        false),
    ('Faq',          'FAQ',           false),
    ('PressMedia',   'Press & Media', false),
    ('SuccessStory', 'Success Story', false),
    ('Banner',       'Banner',        false),
    ('LegalPage',    'Legal Page',    false),
    ('SeoPage',      'SEO Page',      false);

-- Commerce domain (mixed scoping)
INSERT INTO mst_admin_subjects (subject_code, subject_name, franchise_scoped) VALUES
    ('Product',                  'Product',                    false),
    ('ProductOrder',             'Product Order',              true),
    ('Shipment',                 'Shipment',                   true),
    ('CourierProviderAccount',   'Courier Provider Account',   false),
    ('CourierProviderWarehouse', 'Courier Provider Warehouse', false),
    ('CourierProvider',          'Courier Provider',           false),
    ('PromoCode',                'Promo Code',                 true);

-- Program domain (mixed scoping)
INSERT INTO mst_admin_subjects (subject_code, subject_name, franchise_scoped) VALUES
    ('Program',         'Program',          true),
    ('ProgramCategory', 'Program Category', false),
    ('ProgramPlan',     'Program Plan',     true),
    ('DietTemplate',    'Diet Template',    false);

-- Platform domain (mixed scoping)
INSERT INTO mst_admin_subjects (subject_code, subject_name, franchise_scoped) VALUES
    ('AdminUser',      'Admin User',       true),
    ('Franchise',      'Franchise',        true),
    ('Report',         'Report',           true),
    ('Dashboard',      'Dashboard',        true),
    ('TaxMaster',      'Tax Master',       false),
    ('LovMaster',      'LOV Master',       false),
    ('Referrer',       'Referrer',         false),
    ('PocketGuide',    'Pocket Guide',     false),
    ('Notification',   'Notification',     true),
    ('GoogleCalendar', 'Google Calendar',  true);

-- Scheduling domain (new)
INSERT INTO mst_admin_subjects (subject_code, subject_name, franchise_scoped) VALUES
    ('Appointment',  'Appointment',   true),
    ('ContactForm',  'Contact Form',  false);

-- --------------------------------------------------------------------------
-- 2. mst_admin_actions — the 4 discrete CRUD actions
--    No 'manage' action — CASL wildcard is handled at the application layer
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mst_admin_actions (
    action_id   SERIAL PRIMARY KEY,
    action_code VARCHAR(50) NOT NULL UNIQUE,
    action_name VARCHAR(50) NOT NULL
);

INSERT INTO mst_admin_actions (action_id, action_code, action_name) VALUES
    (1, 'read',   'Read'),
    (2, 'create', 'Create'),
    (3, 'update', 'Update'),
    (4, 'delete', 'Delete');

-- --------------------------------------------------------------------------
-- 3. Add grant_all_on_new_subject to mst_admin_roles
--    When true, PostgreSQL trigger auto-inserts all 4 actions for new subjects
-- --------------------------------------------------------------------------
ALTER TABLE mst_admin_roles
    ADD COLUMN IF NOT EXISTS grant_all_on_new_subject BOOLEAN NOT NULL DEFAULT false;

UPDATE mst_admin_roles
    SET grant_all_on_new_subject = true
    WHERE role_code = 'super_admin';

-- --------------------------------------------------------------------------
-- 4. mst_admin_role_subject_permissions — the permission matrix
--    One row per role-subject-action combination
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mst_admin_role_subject_permissions (
    permission_id SERIAL PRIMARY KEY,
    role_id       INT NOT NULL REFERENCES mst_admin_roles(role_id),
    subject_id    INT NOT NULL REFERENCES mst_admin_subjects(subject_id),
    action_id     INT NOT NULL REFERENCES mst_admin_actions(action_id),
    active        BOOLEAN NOT NULL DEFAULT true,
    created_by    INT NOT NULL DEFAULT 1,
    modified_by   INT NOT NULL DEFAULT 1,
    created_ip    VARCHAR(50) NOT NULL DEFAULT '0.0.0.0',
    modified_ip   VARCHAR(50) NOT NULL DEFAULT '0.0.0.0',
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_role_subject_action UNIQUE (role_id, subject_id, action_id)
);

CREATE INDEX IF NOT EXISTS ix_mst_admin_role_subject_permissions_role_id
    ON mst_admin_role_subject_permissions(role_id);

CREATE INDEX IF NOT EXISTS ix_mst_admin_role_subject_permissions_subject_id
    ON mst_admin_role_subject_permissions(subject_id);

COMMIT;
