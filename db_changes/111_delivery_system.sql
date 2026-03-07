-- =============================================================================
-- Migration: 112_delivery_system.sql
-- Description: Delivery & Shipment System — Full Schema
-- Depends on: mst_admin_users, mst_franchises, mst_states, mst_countries,
--             txn_member_product_orders, txn_member_product_order_items
-- =============================================================================

-- =============================================================================
-- SECTION 1: CLEANUP (safe drop in dependency order)
-- =============================================================================

DROP TABLE IF EXISTS public.txn_courier_webhook_logs CASCADE;
DROP TABLE IF EXISTS public.txn_courier_api_logs CASCADE;
DROP TABLE IF EXISTS public.txn_shipment_tracking_events CASCADE;
DROP TABLE IF EXISTS public.txn_shipment_rate_quotes CASCADE;
DROP TABLE IF EXISTS public.txn_shipment_items CASCADE;
DROP TABLE IF EXISTS public.txn_shipments CASCADE;
DROP TABLE IF EXISTS public.cache_pincode_serviceability CASCADE;
DROP TABLE IF EXISTS public.txn_courier_provider_warehouses CASCADE;
DROP TABLE IF EXISTS public.mst_warehouses CASCADE;
DROP TABLE IF EXISTS public.txn_courier_provider_accounts CASCADE;
DROP TABLE IF EXISTS public.mst_courier_providers CASCADE;

DROP TYPE IF EXISTS public.tracking_source_enum CASCADE;
DROP TYPE IF EXISTS public.shipment_status_enum CASCADE;

-- =============================================================================
-- SECTION 2: ENUMS
-- =============================================================================

CREATE TYPE public.shipment_status_enum AS ENUM (
    'DRAFT',
    'RATE_REQUESTED',
    'RATE_SELECTED',
    'BOOKING_REQUESTED',
    'BOOKED',
    'PICKUP_SCHEDULED',
    'IN_TRANSIT',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'RTO',           -- Return to Origin
    'CANCELLED',
    'FAILED'
);

CREATE TYPE public.tracking_source_enum AS ENUM (
    'WEBHOOK',
    'POLLING',
    'MANUAL'
);

-- =============================================================================
-- SECTION 3: MASTER TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Courier Providers (Nimbus, Shiprocket, etc.)
-- supports_cod removed — prepaid only system
-- -----------------------------------------------------------------------------
CREATE TABLE public.mst_courier_providers
(
    provider_id       SERIAL PRIMARY KEY,
    provider_code     VARCHAR(30)  NOT NULL UNIQUE,  -- NIMBUS, SHIPROCKET
    provider_name     VARCHAR(100) NOT NULL,
    auth_type         VARCHAR(30)  NOT NULL,          -- JWT, API_KEY, BASIC
    supports_rate_api BOOLEAN      NOT NULL DEFAULT TRUE,
    supports_webhook  BOOLEAN      NOT NULL DEFAULT TRUE,
    priority_order    INTEGER      NOT NULL DEFAULT 1, -- Lower = higher priority for auto-selection
    active            BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by        INT          NOT NULL,
    updated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by       INT          NOT NULL,
    created_ip        VARCHAR(50)  NOT NULL,
    modified_ip       VARCHAR(50)  NOT NULL,
    CONSTRAINT fk_mst_courier_providers_created_by  FOREIGN KEY (created_by)  REFERENCES public.mst_admin_users (admin_id),
    CONSTRAINT fk_mst_courier_providers_modified_by FOREIGN KEY (modified_by) REFERENCES public.mst_admin_users (admin_id)
);

-- -----------------------------------------------------------------------------
-- Warehouses (internal)
-- -----------------------------------------------------------------------------
CREATE TABLE public.mst_warehouses
(
    warehouse_id  SERIAL PRIMARY KEY,
    name          VARCHAR(150) NOT NULL,
    contact_name  VARCHAR(150),
    email         VARCHAR(150),
    phone         VARCHAR(20),
    address_line1 TEXT         NOT NULL,
    address_line2 TEXT,
    city          VARCHAR(100) NOT NULL,
    state_id      INTEGER      NOT NULL,
    country_id    INTEGER      NOT NULL,
    pin_code      VARCHAR(10)  NOT NULL,
    latitude      NUMERIC(10, 6),
    longitude     NUMERIC(10, 6),
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by    INT          NOT NULL,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by   INT          NOT NULL,
    created_ip    VARCHAR(50)  NOT NULL,
    modified_ip   VARCHAR(50)  NOT NULL,
    CONSTRAINT fk_mst_warehouses_state_id    FOREIGN KEY (state_id)    REFERENCES public.mst_states (state_id),
    CONSTRAINT fk_mst_warehouses_country_id  FOREIGN KEY (country_id)  REFERENCES public.mst_countries (country_id),
    CONSTRAINT fk_mst_warehouses_created_by  FOREIGN KEY (created_by)  REFERENCES public.mst_admin_users (admin_id),
    CONSTRAINT fk_mst_warehouses_modified_by FOREIGN KEY (modified_by) REFERENCES public.mst_admin_users (admin_id)
);

-- =============================================================================
-- SECTION 4: TRANSACTION / CONFIG TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Courier provider credentials per franchise
-- -----------------------------------------------------------------------------
CREATE TABLE public.txn_courier_provider_accounts
(
    provider_account_id SERIAL PRIMARY KEY,
    provider_id         INTEGER      NOT NULL REFERENCES public.mst_courier_providers (provider_id),
    franchise_id        INTEGER      NOT NULL REFERENCES public.mst_franchises (franchise_id),
    account_name        VARCHAR(100),
    api_base_url        TEXT         NOT NULL,
    api_key             TEXT,
    api_secret          TEXT,
    username            TEXT,
    password_encrypted  TEXT,
    auth_token          TEXT,
    token_expiry        TIMESTAMPTZ,
    webhook_secret      TEXT,
    active              BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by          INT          NOT NULL,
    updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by         INT          NOT NULL,
    created_ip          VARCHAR(50)  NOT NULL,
    modified_ip         VARCHAR(50)  NOT NULL,
    CONSTRAINT uq_courier_account_provider_franchise UNIQUE (provider_id, franchise_id),
    CONSTRAINT fk_courier_accounts_created_by  FOREIGN KEY (created_by)  REFERENCES public.mst_admin_users (admin_id),
    CONSTRAINT fk_courier_accounts_modified_by FOREIGN KEY (modified_by) REFERENCES public.mst_admin_users (admin_id)
);

-- -----------------------------------------------------------------------------
-- Maps internal warehouses to provider-side warehouse IDs
-- One warehouse can be registered with multiple providers
-- -----------------------------------------------------------------------------
CREATE TABLE public.txn_courier_provider_warehouses
(
    courier_provider_warehouse_id SERIAL PRIMARY KEY,
    warehouse_id                  INTEGER      NOT NULL REFERENCES public.mst_warehouses (warehouse_id),
    provider_id                   INTEGER      NOT NULL REFERENCES public.mst_courier_providers (provider_id),
    provider_warehouse_id         VARCHAR(100),           -- Provider's own warehouse ID (used in booking API)
    provider_warehouse_name       VARCHAR(150),
    raw_response                  JSONB,
    active                        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at                    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by                    INT          NOT NULL,
    updated_at                    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by                   INT          NOT NULL,
    created_ip                    VARCHAR(50)  NOT NULL,
    modified_ip                   VARCHAR(50)  NOT NULL,
    CONSTRAINT uq_courier_provider_warehouse UNIQUE (warehouse_id, provider_id),
    CONSTRAINT fk_cpw_created_by  FOREIGN KEY (created_by)  REFERENCES public.mst_admin_users (admin_id),
    CONSTRAINT fk_cpw_modified_by FOREIGN KEY (modified_by) REFERENCES public.mst_admin_users (admin_id)
);

-- -----------------------------------------------------------------------------
-- Pincode serviceability cache (Redis-style, in DB as fallback)
-- Avoids repeated API calls for same pincode+provider combination
-- -----------------------------------------------------------------------------
CREATE TABLE public.cache_pincode_serviceability
(
    pincode       VARCHAR(10) NOT NULL,
    provider_id   INTEGER     NOT NULL REFERENCES public.mst_courier_providers (provider_id),
    is_serviceable BOOLEAN    NOT NULL,
    checked_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at    TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (pincode, provider_id)
);

-- =============================================================================
-- SECTION 5: SHIPMENT TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Core shipment record
-- Created as DRAFT when order is placed, updated through lifecycle
-- -----------------------------------------------------------------------------
CREATE TABLE public.txn_shipments
(
    shipment_id          BIGSERIAL PRIMARY KEY,
    shipment_number      VARCHAR(50)          NOT NULL UNIQUE,           -- Internal reference e.g. SHP-2026-000001
    order_id             BIGINT               NOT NULL
        REFERENCES public.txn_member_product_orders (order_id),         -- Direct order link for easy joins
    franchise_id         INTEGER              NOT NULL
        REFERENCES public.mst_franchises (franchise_id),
    warehouse_id         INTEGER
        REFERENCES public.mst_warehouses (warehouse_id),                -- Set after warehouse resolution
    provider_id          INTEGER
        REFERENCES public.mst_courier_providers (provider_id),          -- Set after rate selection
    provider_account_id  INTEGER
        REFERENCES public.txn_courier_provider_accounts (provider_account_id),

    -- Provider-side identifiers (populated after booking)
    provider_shipment_id VARCHAR(100),
    tracking_number      VARCHAR(100),
    tracking_url         TEXT,

    -- Package dimensions (required by courier APIs for rate calculation)
    total_weight_kg      NUMERIC(10, 2),
    length_cm            NUMERIC(8, 2),
    width_cm             NUMERIC(8, 2),
    height_cm            NUMERIC(8, 2),

    -- Receiver address snapshot (denormalized — must not change post-booking)
    receiver_name        VARCHAR(150),
    receiver_phone       VARCHAR(20),
    receiver_address     TEXT,
    receiver_city        VARCHAR(100),
    receiver_state       VARCHAR(100),
    receiver_pincode     VARCHAR(10),
    receiver_country     VARCHAR(100),

    -- Financials
    total_amount         NUMERIC(12, 2),
    rate_amount          NUMERIC(10, 2),                                 -- Final selected rate
    currency             VARCHAR(10)          NOT NULL DEFAULT 'INR',

    -- Lifecycle
    status               public.shipment_status_enum NOT NULL DEFAULT 'DRAFT',
    retry_count          INTEGER              NOT NULL DEFAULT 0,
    last_error           TEXT,                                           -- Last failure reason for retry/alerting
    metadata             JSONB,                                          -- Provider-specific extra data

    created_at           TIMESTAMP            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by           INT                  NOT NULL,
    updated_at           TIMESTAMP            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by          INT                  NOT NULL,
    created_ip           VARCHAR(50)          NOT NULL,
    modified_ip          VARCHAR(50)          NOT NULL,

    CONSTRAINT fk_txn_shipments_created_by  FOREIGN KEY (created_by)  REFERENCES public.mst_admin_users (admin_id),
    CONSTRAINT fk_txn_shipments_modified_by FOREIGN KEY (modified_by) REFERENCES public.mst_admin_users (admin_id)
);

-- -----------------------------------------------------------------------------
-- Items within a shipment (links order items to shipment)
-- -----------------------------------------------------------------------------
CREATE TABLE public.txn_shipment_items
(
    shipment_item_id             BIGSERIAL PRIMARY KEY,
    shipment_id                  BIGINT  NOT NULL
        REFERENCES public.txn_shipments (shipment_id) ON DELETE CASCADE,
    member_product_order_item_id BIGINT  NOT NULL
        REFERENCES public.txn_member_product_order_items (member_product_order_item_id),
    quantity                     INTEGER NOT NULL CHECK (quantity > 0),
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_shipment_item UNIQUE (shipment_id, member_product_order_item_id)
);

-- -----------------------------------------------------------------------------
-- Rate quotes from all providers (fetched in parallel, one row per provider)
-- is_selected enforced to one per shipment via partial unique index
-- uq_rate_per_provider removed — allows re-quoting if job retries
-- -----------------------------------------------------------------------------
CREATE TABLE public.txn_shipment_rate_quotes
(
    rate_quote_id       BIGSERIAL PRIMARY KEY,
    shipment_id         BIGINT         NOT NULL
        REFERENCES public.txn_shipments (shipment_id) ON DELETE CASCADE,
    provider_id         INTEGER        NOT NULL
        REFERENCES public.mst_courier_providers (provider_id),
    provider_account_id INTEGER
        REFERENCES public.txn_courier_provider_accounts (provider_account_id),
    warehouse_id        INTEGER
        REFERENCES public.mst_warehouses (warehouse_id),               -- Which warehouse this quote is from
    service_name        VARCHAR(100),
    estimated_days      INTEGER        CHECK (estimated_days >= 0),
    rate_amount         NUMERIC(10, 2) NOT NULL,
    currency            VARCHAR(10)    NOT NULL DEFAULT 'INR',
    is_serviceable      BOOLEAN        NOT NULL DEFAULT TRUE,
    is_selected         BOOLEAN        NOT NULL DEFAULT FALSE,
    expires_at          TIMESTAMPTZ,                                    -- Rate validity window from provider
    raw_response        JSONB,
    created_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Enforce only one selected rate per shipment
CREATE UNIQUE INDEX uq_one_selected_rate_quote
    ON public.txn_shipment_rate_quotes (shipment_id)
    WHERE is_selected = TRUE;

-- -----------------------------------------------------------------------------
-- Tracking events — append-only log from webhooks, polling, or manual updates
-- -----------------------------------------------------------------------------
CREATE TABLE public.txn_shipment_tracking_events
(
    tracking_event_id BIGSERIAL PRIMARY KEY,
    shipment_id       BIGINT                     NOT NULL
        REFERENCES public.txn_shipments (shipment_id) ON DELETE CASCADE,
    provider_status   VARCHAR(100),                                     -- Raw status string from provider
    internal_status   public.shipment_status_enum,                     -- Mapped to our enum
    description       TEXT,
    location          VARCHAR(200),
    event_time        TIMESTAMPTZ                NOT NULL,
    source            public.tracking_source_enum NOT NULL,
    raw_payload       JSONB,
    created_at        TIMESTAMPTZ                NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tracking_event UNIQUE (shipment_id, provider_status, event_time)
);

-- =============================================================================
-- SECTION 6: LOGGING TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- All outbound API calls to courier providers (rate, book, track, cancel)
-- -----------------------------------------------------------------------------
CREATE TABLE public.txn_courier_api_logs
(
    api_log_id          BIGSERIAL PRIMARY KEY,
    shipment_id         BIGINT,
    provider_id         INTEGER,
    provider_account_id INTEGER,
    request_type        VARCHAR(50),    -- RATE, BOOK, TRACK, CANCEL, SERVICEABILITY
    request_payload     JSONB,
    response_payload    JSONB,
    http_status         INTEGER,
    error_message       TEXT,
    response_time_ms    INTEGER,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Inbound webhook payloads from courier providers
-- provider_account_id added for multi-account routing
-- -----------------------------------------------------------------------------
CREATE TABLE public.txn_courier_webhook_logs
(
    webhook_log_id      BIGSERIAL PRIMARY KEY,
    provider_id         INTEGER,
    provider_account_id INTEGER REFERENCES public.txn_courier_provider_accounts (provider_account_id),
    payload             JSONB   NOT NULL,
    headers             JSONB,
    signature_valid     BOOLEAN,
    processed           BOOLEAN     NOT NULL DEFAULT FALSE,
    error_message       TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- SECTION 7: INDEXES
-- =============================================================================

-- txn_shipments
CREATE INDEX idx_shipments_order_id         ON public.txn_shipments (order_id);
CREATE INDEX idx_shipments_franchise        ON public.txn_shipments (franchise_id);
CREATE INDEX idx_shipments_warehouse        ON public.txn_shipments (warehouse_id);
CREATE INDEX idx_shipments_provider         ON public.txn_shipments (provider_id);
CREATE INDEX idx_shipments_status           ON public.txn_shipments (status);
CREATE INDEX idx_shipments_tracking_number  ON public.txn_shipments (tracking_number);
CREATE INDEX idx_shipments_receiver_pincode ON public.txn_shipments (receiver_pincode);

-- txn_shipment_items
CREATE INDEX idx_shipment_items_shipment    ON public.txn_shipment_items (shipment_id);
CREATE INDEX idx_shipment_items_order_item  ON public.txn_shipment_items (member_product_order_item_id);

-- txn_shipment_rate_quotes
CREATE INDEX idx_rate_quotes_shipment       ON public.txn_shipment_rate_quotes (shipment_id);
CREATE INDEX idx_rate_quotes_provider       ON public.txn_shipment_rate_quotes (provider_id);

-- txn_shipment_tracking_events
CREATE INDEX idx_tracking_shipment          ON public.txn_shipment_tracking_events (shipment_id);
CREATE INDEX idx_tracking_event_time        ON public.txn_shipment_tracking_events (event_time);

-- txn_courier_api_logs
CREATE INDEX idx_api_logs_shipment          ON public.txn_courier_api_logs (shipment_id);
CREATE INDEX idx_api_logs_provider          ON public.txn_courier_api_logs (provider_id);

-- txn_courier_webhook_logs
CREATE INDEX idx_webhook_logs_provider      ON public.txn_courier_webhook_logs (provider_id);
CREATE INDEX idx_webhook_logs_processed     ON public.txn_courier_webhook_logs (processed) WHERE processed = FALSE;

-- cache_pincode_serviceability
CREATE INDEX idx_pincode_cache_expires      ON public.cache_pincode_serviceability (expires_at);

-- =============================================================================
-- SECTION 8: SEED DATA
-- =============================================================================

-- Remove legacy WooCommerce config
DELETE FROM public.mst_configs
WHERE config_name IN (
                      'WOOCOMMERCE_BASE_URL',
                      'WOOCOMMERCE_CONSUMER_KEY',
                      'WOOCOMMERCE_CONSUMER_SECRET',
                      'WOOCOMMERCE_API_VERSION'
    ) AND module = 'WooCommerce';

-- Courier Providers (supports_cod removed)
INSERT INTO public.mst_courier_providers
(provider_id, provider_code, provider_name, auth_type, supports_rate_api, supports_webhook, priority_order, active, created_at, created_by, updated_at, modified_by, created_ip, modified_ip)
VALUES
    (1, 'NIMBUS',     'Nimbus Post', 'JWT',     TRUE, TRUE, 1, TRUE, '2026-02-21 04:57:58', 1, '2026-02-21 04:57:58', 1, '::1', '::1'),
    (2, 'SHIPROCKET', 'Shiprocket',  'JWT',     TRUE, TRUE, 2, TRUE, '2026-02-21 04:58:19', 1, '2026-02-21 04:58:19', 1, '::1', '::1'),
    (3, 'SHIPWAY',    'Shipway',     'API_KEY', TRUE, TRUE, 3, TRUE, '2026-02-21 04:58:39', 1, '2026-02-21 04:58:39', 1, '::1', '::1');

-- Courier Provider Accounts (franchise_id = 3)
INSERT INTO public.txn_courier_provider_accounts
(provider_id, franchise_id, account_name, api_base_url, username, password_encrypted, webhook_secret, active, created_by, modified_by, created_ip, modified_ip)
VALUES
    (1, 3, 'Nimbus Main Account', 'https://api.nimbuspost.com/v1',  'logistics@eatfit24by7.com', 'ENCRYPTED_NIMBUS_PASSWORD',     'nimbus_webhook_secret_key',     TRUE, 1, 1, '127.0.0.1', '127.0.0.1'),
    (2, 3, 'Shiprocket Primary',  'https://apiv2.shiprocket.in/v1',  'SHIPROCKET_API_KEY',        'ENCRYPTED_SHIPROCKET_SECRET',   'shiprocket_webhook_secret_key', TRUE, 1, 1, '127.0.0.1', '127.0.0.1'),
    (3, 3, 'Shipway Logistics',   'https://api.shipway.com',      'SHIPWAY_API_KEY',           '',                              'shipway_webhook_secret_key',    TRUE, 1, 1, '127.0.0.1', '127.0.0.1');

ALTER TABLE public.txn_shipments
    ADD COLUMN last_known_status public.shipment_status_enum,  -- status before failure
  ADD COLUMN next_retry_at     TIMESTAMPTZ;                  -- cron checks this field