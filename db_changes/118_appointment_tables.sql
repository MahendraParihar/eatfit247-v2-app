-- ============================================================================
-- 118: Appointment Management — Tables, status/type seeds
-- PRD Reference: BR-10 (Appointment Management)
-- ============================================================================

BEGIN;

-- --------------------------------------------------------------------------
-- 1. mst_appointment_statuses — appointment lifecycle states
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mst_appointment_statuses (
    appointment_status_id SERIAL PRIMARY KEY,
    appointment_status    VARCHAR(50) NOT NULL,
    active                BOOLEAN NOT NULL DEFAULT true,
    created_by            INT NOT NULL DEFAULT 1,
    modified_by           INT NOT NULL DEFAULT 1,
    created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO mst_appointment_statuses (appointment_status_id, appointment_status) VALUES
    (1, 'Scheduled'),
    (2, 'Confirmed'),
    (3, 'Completed'),
    (4, 'Cancelled'),
    (5, 'No-Show');

-- --------------------------------------------------------------------------
-- 2. mst_appointment_types — appointment purpose categories
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mst_appointment_types (
    appointment_type_id SERIAL PRIMARY KEY,
    appointment_type    VARCHAR(50) NOT NULL,
    active              BOOLEAN NOT NULL DEFAULT true,
    created_by          INT NOT NULL DEFAULT 1,
    modified_by         INT NOT NULL DEFAULT 1,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO mst_appointment_types (appointment_type_id, appointment_type) VALUES
    (1, 'New Enquiry'),
    (2, 'Follow-up'),
    (3, 'Consultation'),
    (4, 'Assessment Review');

-- --------------------------------------------------------------------------
-- 3. txn_appointments — the main appointments table
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS txn_appointments (
    appointment_id      SERIAL PRIMARY KEY,
    contact_form_id     INT NULL REFERENCES txn_contact_forms(contact_form_id),
    member_id           INT NULL,
    assigned_admin_id   INT NOT NULL REFERENCES mst_admin_users(admin_id),
    booked_by_admin_id  INT NOT NULL REFERENCES mst_admin_users(admin_id),
    franchise_id        INT NOT NULL REFERENCES mst_franchises(franchise_id),
    appointment_date    DATE NOT NULL,
    start_time          TIME NOT NULL,
    end_time            TIME NOT NULL,
    status              INT NOT NULL DEFAULT 1 REFERENCES mst_appointment_statuses(appointment_status_id),
    appointment_type    INT NOT NULL REFERENCES mst_appointment_types(appointment_type_id),
    guest_name          VARCHAR(100) NULL,
    guest_email         VARCHAR(100) NULL,
    guest_phone         VARCHAR(25) NULL,
    notes               TEXT NULL,
    cancellation_reason VARCHAR(500) NULL,
    google_event_id     VARCHAR(255) NULL,
    reminder_sent       BOOLEAN NOT NULL DEFAULT false,
    active              BOOLEAN NOT NULL DEFAULT true,
    created_by          INT NOT NULL DEFAULT 1,
    modified_by         INT NOT NULL DEFAULT 1,
    created_ip          VARCHAR(50) NOT NULL DEFAULT '0.0.0.0',
    modified_ip         VARCHAR(50) NOT NULL DEFAULT '0.0.0.0',
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS ix_txn_appointments_date
    ON txn_appointments(appointment_date);

CREATE INDEX IF NOT EXISTS ix_txn_appointments_assigned_admin
    ON txn_appointments(assigned_admin_id);

CREATE INDEX IF NOT EXISTS ix_txn_appointments_franchise
    ON txn_appointments(franchise_id);

CREATE INDEX IF NOT EXISTS ix_txn_appointments_status
    ON txn_appointments(status);

-- Composite index for overlap checks
CREATE INDEX IF NOT EXISTS ix_txn_appointments_date_admin
    ON txn_appointments(appointment_date, assigned_admin_id);

-- Index for reminder cron query
CREATE INDEX IF NOT EXISTS ix_txn_appointments_reminder
    ON txn_appointments(appointment_date, reminder_sent, status)
    WHERE active = true;

COMMIT;
