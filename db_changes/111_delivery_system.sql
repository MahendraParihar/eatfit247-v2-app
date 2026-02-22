drop table if exists public.txn_shipment_items cascade;
drop table if exists public.txn_shipment_tracking_events cascade;
drop table if exists public.txn_shipments cascade;

create table public.mst_courier_providers
(
    provider_id       serial primary key,
    provider_code     varchar(30)  not null unique, -- NIMBUS, SHIPROCKET, SHIPWAY
    provider_name     varchar(100) not null,
    auth_type         varchar(30)  not null,        -- API_KEY, JWT, BASIC
    supports_rate_api boolean               default true,
    supports_webhook  boolean               default true,
    supports_cod      boolean               default true,
    priority_order    integer               default 1,
    active            BOOLEAN      NULL     DEFAULT '1',
    created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by        INT          NOT NULL,
    updated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by       INT          NOT NULL,
    created_ip        VARCHAR(50)  NOT NULL,
    modified_ip       VARCHAR(50)  NOT NULL,
    CONSTRAINT fk_mst_courier_provider_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_courier_provider_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);

create table public.txn_courier_provider_accounts
(
    provider_account_id serial primary key,
    provider_id         integer     not null
        references public.mst_courier_providers,
    franchise_id        integer     not null
        references public.mst_franchises,
    account_name        varchar(100),
    api_base_url        text        not null,
    api_key             text,
    api_secret          text,
    username            text,
    password_encrypted  text,
    auth_token          text,
    token_expiry        timestamptz,
    webhook_secret      text,
    active              BOOLEAN     NULL     DEFAULT '1',
    created_at          TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by          INT         NOT NULL,
    updated_at          TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by         INT         NOT NULL,
    created_ip          VARCHAR(50) NOT NULL,
    modified_ip         VARCHAR(50) NOT NULL,
    CONSTRAINT fk_txn_courier_provider_account_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_txn_courier_provider_account_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id),
    unique (provider_id, franchise_id)
);

drop type if exists public.shipment_status_enum cascade;
create type public.shipment_status_enum as enum (
    'DRAFT',
    'RATE_REQUESTED',
    'RATE_SELECTED',
    'BOOKING_REQUESTED',
    'BOOKED',
    'PICKUP_SCHEDULED',
    'IN_TRANSIT',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'RTO',
    'CANCELLED',
    'FAILED'
    );

create type public.tracking_source_enum as enum (
    'WEBHOOK',
    'POLLING',
    'MANUAL'
    );

drop table if exists public.txn_shipments cascade;
create table public.txn_shipments
(
    shipment_id          bigserial primary key,
    shipment_number      varchar(50) not null unique,
    franchise_id         integer     not null
        references public.mst_franchises,
    provider_id          integer
        references public.mst_courier_providers,
    provider_account_id  integer
        references public.txn_courier_provider_accounts,
    provider_shipment_id varchar(100),
    tracking_number      varchar(100),
    tracking_url         text,
    total_weight_kg      numeric(10, 2),
    total_amount         numeric(12, 2),
    rate_amount          numeric(10, 2),
    currency             varchar(10),
    status               shipment_status_enum
                                     not null default 'DRAFT',
    retry_count          integer     not null default 0,
    last_error           text,
    metadata             jsonb,
    created_at           TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by           INT         NOT NULL,
    updated_at           TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by          INT         NOT NULL,
    created_ip           VARCHAR(50) NOT NULL,
    modified_ip          VARCHAR(50) NOT NULL,
    CONSTRAINT fk_txn_shipments_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_txn_shipments_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);

drop table if exists public.txn_shipment_items cascade;
create table public.txn_shipment_items
(
    shipment_item_id             bigserial primary key,
    shipment_id                  bigint  not null
        references public.txn_shipments
            on delete cascade,
    member_product_order_item_id bigint  not null
        references public.txn_member_product_order_items,
    quantity                     integer not null check (quantity > 0),
    created_at                   timestamptz default now(),
    constraint uq_shipment_item
        unique (shipment_id, member_product_order_item_id)
);

drop table if exists public.txn_shipment_rate_quotes cascade;
create table public.txn_shipment_rate_quotes
(
    rate_quote_id       bigserial primary key,
    shipment_id         bigint         not null
        references public.txn_shipments
            on delete cascade,
    provider_id         integer        not null
        references public.mst_courier_providers,
    provider_account_id integer
        references public.txn_courier_provider_accounts,
    service_name        varchar(100),
    estimated_days      integer check (estimated_days >= 0),
    rate_amount         numeric(10, 2) not null,
    currency            varchar(10)    not null,
    is_selected         boolean        not null default false,
    raw_response        jsonb,
    created_at          timestamptz             default now(),
    constraint uq_rate_per_provider
        unique (shipment_id, provider_id)
);

drop table if exists public.txn_shipment_tracking_events cascade;
create table public.txn_shipment_tracking_events
(
    tracking_event_id     bigserial primary key,
    shipment_id           bigint not null
        references public.txn_shipments
            on delete cascade,
    provider_status       varchar(100),
    internal_status       shipment_status_enum,
    description           text,
    location              varchar(200),
    event_time            timestamptz not null,
    source                tracking_source_enum not null,
    raw_payload           jsonb,
    created_at            timestamptz default now(),
    constraint uq_tracking_event
        unique (shipment_id, provider_status, event_time)
);

drop table if exists public.txn_courier_api_logs cascade;
create table public.txn_courier_api_logs
(
    api_log_id       bigserial primary key,
    shipment_id      bigint,
    provider_id      integer,
    request_type     varchar(50), -- RATE, BOOK, TRACK, CANCEL
    request_payload  jsonb,
    response_payload jsonb,
    http_status      integer,
    error_message    text,
    response_time_ms integer,
    created_at       timestamptz default now()
);

drop table if exists public.txn_courier_webhook_logs cascade;
create table public.txn_courier_webhook_logs
(
    webhook_log_id  bigserial primary key,
    provider_id     integer,
    payload         jsonb not null,
    headers         jsonb,
    signature_valid boolean,
    processed       boolean     default false,
    error_message   text,
    created_at      timestamptz default now()
);

-- Shipment lookups
drop index if exists idx_shipments_franchise;
create index idx_shipments_franchise
    on public.txn_shipments(franchise_id);

drop index if exists idx_shipments_provider;
create index idx_shipments_provider
    on public.txn_shipments(provider_id);

drop index if exists idx_shipments_provider_account;
create index idx_shipments_status
    on public.txn_shipments(status);

drop index if exists idx_shipments_tracking;
create index idx_shipments_tracking
    on public.txn_shipments(tracking_number);


-- Shipment items
drop index if exists idx_shipment_items_shipment;
create index idx_shipment_items_shipment
    on public.txn_shipment_items(shipment_id);

drop index if exists idx_shipment_items_order_item;
create index idx_shipment_items_order_item
    on public.txn_shipment_items(member_product_order_item_id);


-- Rate quotes
drop index if exists idx_rate_quotes_shipment;
create index idx_rate_quotes_shipment
    on public.txn_shipment_rate_quotes(shipment_id);

drop index if exists idx_rate_quotes_provider;
create index idx_rate_quotes_provider
    on public.txn_shipment_rate_quotes(provider_id);


-- Tracking events

drop index if exists idx_tracking_shipment;
create index idx_tracking_shipment
    on public.txn_shipment_tracking_events(shipment_id);

drop index if exists idx_tracking_event_time;
create index idx_tracking_event_time
    on public.txn_shipment_tracking_events(event_time);

-- Remove WooCommerce configuration entries from the mst_configs table
DELETE
FROM public.mst_configs
WHERE config_name IN (
                      'WOOCOMMERCE_BASE_URL',
                      'WOOCOMMERCE_CONSUMER_KEY',
                      'WOOCOMMERCE_CONSUMER_SECRET',
                      'WOOCOMMERCE_API_VERSION'
    )
  AND module = 'WooCommerce';

INSERT INTO public.mst_courier_providers (provider_id, provider_code, provider_name, auth_type, supports_rate_api,
                                          supports_webhook, supports_cod, priority_order, active, created_at,
                                          created_by, updated_at, modified_by, created_ip, modified_ip)
VALUES (1, 'NIMBUS', 'Nimbus', 'JWT', true, true, true, 1, true, '2026-02-21 04:57:58.041000', 1,
        '2026-02-21 04:57:58.041000', 1, '::1', '::1');
INSERT INTO public.mst_courier_providers (provider_id, provider_code, provider_name, auth_type, supports_rate_api,
                                          supports_webhook, supports_cod, priority_order, active, created_at,
                                          created_by, updated_at, modified_by, created_ip, modified_ip)
VALUES (2, 'SHIPROCKET', 'Ship Rocket', 'JWT', true, true, true, 2, true, '2026-02-21 04:58:19.996000', 1,
        '2026-02-21 04:58:19.996000', 1, '::1', '::1');
INSERT INTO public.mst_courier_providers (provider_id, provider_code, provider_name, auth_type, supports_rate_api,
                                          supports_webhook, supports_cod, priority_order, active, created_at,
                                          created_by, updated_at, modified_by, created_ip, modified_ip)
VALUES (3, 'SHIPWAY', 'Shipway', 'API_KEY', true, true, true, 3, true, '2026-02-21 04:58:39.887000', 1,
        '2026-02-21 04:58:39.887000', 1, '::1', '::1');


insert into public.txn_courier_provider_accounts
(provider_id,
 franchise_id,
 account_name,
 api_base_url,
 username,
 password_encrypted,
 webhook_secret,
 active, created_by, modified_by, created_ip, modified_ip)
values (1, -- NIMBUS
        3, -- franchise_id
        'Nimbus Main Account',
        'https://ship.nimbuspost.com',
        'logistics@eatfit24by7.com',
        'ENCRYPTED_NIMBUS_PASSWORD',
        'nimbus_webhook_secret_key',
        true, 1, 1, '127.0.0.1', '127.0.0.1'),
       (2, -- SHIPROCKET
        3,
        'Shiprocket Primary',
        'https://apiv2.shiprocket.in',
        'SHIPROCKET_API_KEY',
        'ENCRYPTED_SHIPROCKET_SECRET',
        'shiprocket_webhook_secret_key',
        true, 1, 1, '127.0.0.1', '127.0.0.1'),
       (3, -- SHIPWAY
        3,
        'Shipway Logistics',
        'https://api.shipway.com',
        'SHIPWAY_API_KEY',
        '',
        'shipway_webhook_secret_key', true, 1, 1, '127.0.0.1', '127.0.0.1');
