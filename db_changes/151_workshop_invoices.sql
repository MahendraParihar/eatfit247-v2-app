-- ============================================================================
-- 151: Workshop invoices
-- Spec: specs/features/2026-10-26-workshop-invoice (plan group 1)
-- Base: production schema at 136 (151 is the next free number across branches;
-- 137-149 are used on the tax branches and 150 is reserved by 4.14).
-- Safe to re-run.
--
-- 1. txn_workshop_invoices   — one invoice line per row; the number comes from
--    the franchise's SERVICE (S) series on the first move to PAID (decisions 1-9)
-- 2. txn_invoice_renumber_log — audit trail of the one-off renumbering (decision 16)
-- 3. RBAC subject WorkshopInvoice (franchise-scoped). The AFTER INSERT trigger
--    grants it to Super Admin; Financial Manager gets all four actions (decision 10)
-- ============================================================================

BEGIN;

-- 1. Workshop invoices
CREATE TABLE IF NOT EXISTS txn_workshop_invoices (
    workshop_invoice_id      SERIAL PRIMARY KEY,
    franchise_id             INTEGER        NOT NULL,
    invoice_id               VARCHAR(100),
    invoice_date             DATE           NOT NULL,
    supply_date              DATE           NOT NULL,

    -- Bill-to party (entered by the admin, decision 13)
    bill_to_name             VARCHAR(200)   NOT NULL,
    bill_to_contact_person   VARCHAR(150),
    bill_to_email            VARCHAR(150),
    bill_to_phone            VARCHAR(25),
    bill_to_gstin            VARCHAR(15),
    bill_to_address          JSONB          NOT NULL,
    bill_to_country_id       INTEGER        NOT NULL,
    bill_to_state_id         INTEGER        NOT NULL,
    place_of_supply_state_id INTEGER        NOT NULL,

    -- Invoice line
    description              VARCHAR(500)   NOT NULL,
    sac_code                 VARCHAR(10),
    quantity                 INTEGER        NOT NULL,
    unit_rate                NUMERIC(12, 2) NOT NULL,

    -- Amounts and stored tax result (decision 5)
    order_amount             NUMERIC(12, 2) NOT NULL,
    discount_amount          NUMERIC(12, 2) NOT NULL DEFAULT 0,
    tax_amount               NUMERIC(12, 2) NOT NULL,
    total_amount             NUMERIC(12, 2) NOT NULL,
    currency                 VARCHAR(3)     NOT NULL,
    tax_obj                  JSONB,
    tax_type                 tax_type,
    tax_mode                 tax_mode,
    tax_percentage           NUMERIC(5, 2),
    is_lut_applied           BOOLEAN        NOT NULL DEFAULT false,
    jurisdiction             JSONB,

    -- Payment (same statuses and rules as member payments, decision 7)
    payment_status_id        INTEGER        NOT NULL,
    payment_mode_id          INTEGER,
    transaction_id           VARCHAR(250),
    payment_date             DATE,

    -- Notes and cancel (decision 8)
    notes                    TEXT,
    cancel_reason            VARCHAR(500),
    active                   BOOLEAN        NOT NULL DEFAULT true,

    created_by               INTEGER        NOT NULL,
    modified_by              INTEGER        NOT NULL,
    created_ip               VARCHAR(50)    NOT NULL,
    modified_ip              VARCHAR(50)    NOT NULL,
    created_at               TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at               TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_txn_workshop_invoices_invoice_id UNIQUE (invoice_id),
    CONSTRAINT chk_txn_workshop_invoices_quantity CHECK (quantity > 0),
    CONSTRAINT chk_txn_workshop_invoices_unit_rate CHECK (unit_rate >= 0),
    CONSTRAINT fk_txn_workshop_invoices_franchise
        FOREIGN KEY (franchise_id) REFERENCES mst_franchises (franchise_id),
    CONSTRAINT fk_txn_workshop_invoices_bill_to_country
        FOREIGN KEY (bill_to_country_id) REFERENCES mst_countries (country_id),
    CONSTRAINT fk_txn_workshop_invoices_bill_to_state
        FOREIGN KEY (bill_to_state_id) REFERENCES mst_states (state_id),
    CONSTRAINT fk_txn_workshop_invoices_place_of_supply_state
        FOREIGN KEY (place_of_supply_state_id) REFERENCES mst_states (state_id),
    CONSTRAINT fk_txn_workshop_invoices_payment_status
        FOREIGN KEY (payment_status_id) REFERENCES mst_payment_status (payment_status_id),
    CONSTRAINT fk_txn_workshop_invoices_payment_mode
        FOREIGN KEY (payment_mode_id) REFERENCES mst_payment_modes (payment_mode_id),
    CONSTRAINT fk_txn_workshop_invoices_created_by
        FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_txn_workshop_invoices_modified_by
        FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);

CREATE INDEX IF NOT EXISTS idx_txn_workshop_invoices_franchise_date
    ON txn_workshop_invoices (franchise_id, invoice_date);

CREATE INDEX IF NOT EXISTS idx_txn_workshop_invoices_payment_status
    ON txn_workshop_invoices (payment_status_id);

-- 2. Renumbering audit log (rows are never deleted)
CREATE TABLE IF NOT EXISTS txn_invoice_renumber_log (
    renumber_log_id SERIAL PRIMARY KEY,
    run_id          UUID         NOT NULL,
    table_name      VARCHAR(64)  NOT NULL,
    row_id          INTEGER      NOT NULL,
    old_invoice_id  VARCHAR(100),
    new_invoice_id  VARCHAR(100) NOT NULL,
    reason          TEXT         NOT NULL,
    active          BOOLEAN      NOT NULL DEFAULT true,
    created_by      INTEGER      NOT NULL,
    modified_by     INTEGER      NOT NULL,
    created_ip      VARCHAR(50)  NOT NULL,
    modified_ip     VARCHAR(50)  NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_txn_invoice_renumber_log_created_by
        FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_txn_invoice_renumber_log_modified_by
        FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);

CREATE INDEX IF NOT EXISTS idx_txn_invoice_renumber_log_run
    ON txn_invoice_renumber_log (run_id);

CREATE INDEX IF NOT EXISTS idx_txn_invoice_renumber_log_row
    ON txn_invoice_renumber_log (table_name, row_id);

-- 3. RBAC subject (the trigger grants Super Admin all four actions)
INSERT INTO mst_admin_subjects (subject_code, subject_name, franchise_scoped)
VALUES ('WorkshopInvoice', 'Workshop Invoice', true)
ON CONFLICT (subject_code) DO NOTHING;

-- Financial Manager: read/create/update/delete (delete = cancel).
-- Existing rows, including deliberately deactivated ones, are left alone.
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
WHERE r.role_code = 'financial_manager'
  AND s.subject_code = 'WorkshopInvoice'
  AND a.action_code IN ('read', 'create', 'update', 'delete')
ON CONFLICT (role_id, subject_id, action_id) DO NOTHING;

COMMIT;

-- ============================================================================
-- Rollback (manual, only before any workshop invoice is issued):
--
-- UPDATE mst_admin_role_subject_permissions SET active = false
--  WHERE subject_id = (SELECT subject_id FROM mst_admin_subjects WHERE subject_code = 'WorkshopInvoice');
-- UPDATE mst_admin_subjects SET active = false WHERE subject_code = 'WorkshopInvoice';
-- The tables are harmless without the feature and stay.
-- ============================================================================
