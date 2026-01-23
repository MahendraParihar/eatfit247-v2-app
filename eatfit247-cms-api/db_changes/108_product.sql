create table public.mst_product
(
    product_id      serial primary key,
    name            varchar(255)             not null,
    image_path      jsonb                    not null,
    additional_info jsonb                    not null default '{}',
    hsn_code        varchar(100)             not null,
    active          boolean                           default true not null,
    created_by      integer
        constraint fk_txn_member_product_mst_admin_created_by
            references public.mst_admin_users,
    created_at      timestamp with time zone not null,
    modified_by     integer
        constraint fk_txn_member_product_mst_admin_modified_by
            references public.mst_admin_users,
    updated_at      timestamp with time zone not null,
    created_ip      character varying(50),
    modified_ip     character varying(50)
);

INSERT INTO public.mst_configs (config_id, config_name, config_value, module)
VALUES (DEFAULT, 'WOOCOMMERCE_BASE_URL', 'XYZ', 'WooCommerce');
INSERT INTO public.mst_configs (config_id, config_name, config_value, module)
VALUES (DEFAULT, 'WOOCOMMERCE_CONSUMER_KEY', 'XYZ', 'WooCommerce');
INSERT INTO public.mst_configs (config_id, config_name, config_value, module)
VALUES (DEFAULT, 'WOOCOMMERCE_CONSUMER_SECRET', 'XYZ', 'WooCommerce');
INSERT INTO public.mst_configs (config_id, config_name, config_value, module)
VALUES (DEFAULT, 'WOOCOMMERCE_API_VERSION', 'v3', 'WooCommerce');


UPDATE txn_member_payments AS tu
SET payment_obj =
        jsonb_build_object(
                'currency', tu.payment_obj -> 'user' ->> 'currency',
                'pricing', jsonb_build_object(
                        'orderAmount', (tu.payment_obj -> 'user' ->> 'orderAmount')::double precision,
                        'discountAmount', (tu.payment_obj -> 'user' ->> 'discountAmount')::double precision,
                        'taxAmount', (tu.payment_obj -> 'user' ->> 'taxAmount')::double precision,
                        'totalAmount', (tu.payment_obj -> 'user' ->> 'totalAmount')::double precision
                           ),
                'tax', jsonb_build_object(
                        'taxType', 'GST',
                        'taxMode', 'DOMESTIC',
                        'taxPercentage', (tu.payment_obj ->> 'taxPercentage')::double precision,
                        'taxAmount', (tu.payment_obj -> 'user' ->> 'taxAmount')::double precision,
                        'isTaxIncludedInPrice', false,
                        'isLutApplied', false,
                        'taxObj', (tu.payment_obj -> 'user' -> 'taxObj')::jsonb
                       ),
                'jurisdiction', jsonb_build_object(
                        'entityCountry', (SELECT mc.country
                                          FROM txn_member_payments tmp
                                                   JOIN txn_members tm ON tm.member_id = tmp.member_id
                                                   JOIN mst_franchises mf ON mf.franchise_id = tm.franchise_id
                                                   JOIN txn_addresses ta
                                                        ON mf.franchise_id = ta.pk_of_table
                                                            AND ta.table_id = (SELECT table_id
                                                                               FROM mst_table
                                                                               WHERE table_name = 'mst_franchises'
                                                                               LIMIT 1)
                                                   JOIN public.mst_countries mc ON ta.country_id = mc.country_id
                                          WHERE tmp.member_payment_id = tu.member_payment_id),
                        'customerCountry',
                        (SELECT mc.country
                         FROM txn_member_payments tmp
                                  JOIN txn_addresses ta ON tmp.billing_address_id = ta.address_id
                                  JOIN public.mst_countries mc ON ta.country_id = mc.country_id
                         WHERE tmp.member_payment_id = tu.member_payment_id
                         LIMIT 1),
                        'placeOfSupply',
                        (SELECT mc.country
                         FROM txn_member_payments tmp
                                  JOIN txn_addresses ta ON tmp.address_id = ta.address_id
                                  JOIN public.mst_countries mc ON ta.country_id = mc.country_id
                         WHERE tmp.member_payment_id = tu.member_payment_id
                         LIMIT 1)
                                ),
                'invoice', jsonb_build_object(
                        'note', ''
                           ),
                'calculationVersion', ''
        );

CREATE TABLE mst_product_variants
(
    product_variant_id serial primary key,
    product_id         integer REFERENCES mst_product (product_id),
    quantity_value     NUMERIC(10, 2), -- 200, 500
    quantity_unit      VARCHAR(10),    -- gm, kg
    sku                VARCHAR(50) UNIQUE
);

CREATE TABLE mst_product_prices
(
    id                 serial primary key,
    product_variant_id integer REFERENCES mst_product_variants (product_variant_id),
    currency           VARCHAR(3), -- INR, USD
    price              NUMERIC(10, 2),
    tax_percent        NUMERIC(5, 2),
    active             BOOLEAN DEFAULT true,
    valid_from         DATE,
    valid_to           DATE
);

CREATE TABLE mst_tax_master
(
    id               serial PRIMARY KEY,
    franchise_id     integer REFERENCES mst_franchises (franchise_id) NOT NULL,
    reference_id     BIGINT                                           NOT NULL,

    -- Geography
    country_code     CHAR(3)                                          NOT NULL, -- IN, AE, US

    -- Tax system
    transaction_type public.transaction_type                          NOT NULL, -- SERVICE, PRODUCT
    tax_system       public.tax_type                                  NOT NULL, -- GST, VAT, SALES_TAX
    tax_code         VARCHAR(50)                                      NOT NULL, -- GST_18, VAT_5, VAT_0
    tax_name         VARCHAR(100)                                     NOT NULL, -- GST 18%, UAE VAT 5%

    -- Behavior
    apply_on         VARCHAR(20)                                      NOT NULL DEFAULT 'SALE',
    is_tax_inclusive BOOLEAN                                          NOT NULL DEFAULT FALSE,

    -- Validity
    effective_from   DATE                                             NOT NULL,
    effective_to     DATE,
    active           BOOLEAN                                          NOT NULL DEFAULT TRUE,

    created_by       integer
        constraint fk_mst_tax_master_mst_admin_created_by
            references public.mst_admin_users,
    created_at       timestamp with time zone                         not null,
    modified_by      integer
        constraint fk_mst_tax_master_mst_admin_modified_by
            references public.mst_admin_users,
    updated_at       timestamp with time zone                         not null,
    created_ip       character varying(50),
    modified_ip      character varying(50),

    -- Constraints
    CONSTRAINT uq_tax_master UNIQUE (
                                     franchise_id,
                                     reference_id,
                                     country_code,
                                     tax_code,
                                     effective_from
        )
);

CREATE TYPE public.shipment_status_enum AS ENUM (
    'CREATED',
    'PACKED',
    'SHIPPED',
    'IN_TRANSIT',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'FAILED',
    'RETURNED'
    );

CREATE TYPE public.shipment_tracking_enum AS ENUM (
    'COURIER',
    'SYSTEM',
    'ADMIN'
    );

drop table if exists public.txn_member_products;
create table public.txn_member_products
(
    member_product_id        serial
        primary key,
    member_id                integer                     not null
        constraint fk_txn_member_product_txn_member_member_id
            references public.txn_members,
    payment_mode_id          integer
        constraint fk_txn_member_product_mst_payment_mode_id
            references public.mst_payment_modes,
    address_id               integer
        constraint fk_txn_member_product_txn_member_address_id
            references public.txn_addresses,
    transaction_id           varchar(250),
    payment_date             date                        null,
    invoice_id               varchar(100),
    payment_status_id        integer                     not null
        constraint fk_txn_member_product_mst_payment_statuses_id
            references public.mst_payment_status,
    franchise_id             integer
        constraint txn_member_products_mst_franchises_franchise_id_fk
            references public.mst_franchises,
    promo_code               varchar(100)   default NULL::character varying,
    refund_obj               jsonb,
    payment_gateway_response jsonb,
    gst_number               varchar(50),
    billing_address_id       integer
        constraint txn_member_products_txn_addresses_address_id_fk
            references public.txn_addresses,
    member_address           jsonb,
    order_amount             NUMERIC(10, 2),
    tax_amount               NUMERIC(10, 2),
    total_amount             NUMERIC(10, 2),
    discount_amount          NUMERIC(10, 2) DEFAULT 0,
    currency                 VARCHAR(3),
    tax_type                 public.tax_type,
    tax_mode                 public.tax_mode,
    tax_percentage           NUMERIC(5, 2),
    is_lut_applied           BOOLEAN        DEFAULT false,
    is_tax_included          BOOLEAN        DEFAULT false,
    jurisdiction             jsonb,
    invoice_note             text           default null,
    payment_source           varchar(30)    default 'MANUAL'::character varying,
    gateway_provider         varchar(50),
    gateway_order_id         varchar(100),
    gateway_payment_id       varchar(100),
    payment_link             varchar(500),
    active                   boolean        default true not null,
    created_by               integer
        constraint fk_txn_member_product_mst_admin_created_by
            references public.mst_admin_users,
    created_at               timestamp
                                 with time zone          not null,
    modified_by              integer
        constraint fk_txn_member_product_mst_admin_modified_by
            references public.mst_admin_users,
    updated_at               timestamp with time zone    not null,
    created_ip               character varying(50),
    modified_ip              character varying(50)
);

create index ix_txn_member_product_member_id
    on public.txn_member_products (member_id);

create unique index ix_uk_txn_member_product_invoice_id
    on public.txn_member_products (invoice_id);

drop table if exists public.txn_member_product_order_items;
create TABLE public.txn_member_product_order_items
(
    member_product_order_item_id serial primary key,
    member_product_id            integer REFERENCES txn_member_products (member_product_id),
    product_id                   integer REFERENCES mst_product (product_id),
    product_variant_id           integer REFERENCES mst_product_variants (product_variant_id),
    product_name                 varchar(100),
    quantity_label               VARCHAR(50),
    unit_price                   NUMERIC(10, 2),
    tax_amount                   NUMERIC(10, 2) DEFAULT 0,
    tax_percent                  NUMERIC(5, 2),
    total_price                  NUMERIC(10, 2),
    tax_obj                      jsonb
);

drop table if exists public.txn_shipments;
CREATE TABLE public.txn_shipments
(
    shipment_id       serial primary key,
    member_product_id integer                     NOT NULL REFERENCES txn_member_products (member_product_id) ON DELETE CASCADE,
    franchise_id      integer                     NOT NULL REFERENCES mst_franchises (franchise_id),
    shipment_no       VARCHAR(30) UNIQUE          NOT NULL,
    courier           VARCHAR(50), -- delhivery, dtdc, aramex
    tracking_no       VARCHAR(100),
    tracking_url      TEXT,
    status            public.shipment_status_enum not null default 'CREATED',
    shipped_at        TIMESTAMP,
    delivered_at      TIMESTAMP,
    created_by        integer
        constraint fk_txn_shipments_mst_admin_created_by
            references public.mst_admin_users,
    created_at        timestamp with time zone    not null,
    modified_by       integer
        constraint fk_txn_shipments_mst_admin_modified_by
            references public.mst_admin_users,
    updated_at        timestamp with time zone    not null,
    created_ip        character varying(50),
    modified_ip       character varying(50)
);

drop table if exists public.txn_shipment_items;
CREATE TABLE public.txn_shipment_items
(
    shipment_item_id             serial primary key,
    shipment_id                  integer REFERENCES txn_shipments (shipment_id) ON DELETE CASCADE,
    member_product_order_item_id integer REFERENCES txn_member_product_order_items (member_product_order_item_id),
    quantity                     INTEGER NOT NULL
);

drop table if exists public.txn_shipment_tracking_events;
CREATE TABLE txn_shipment_tracking_events
(
    shipment_tracking_event_id serial primary key,
    shipment_id                integer REFERENCES txn_shipments (shipment_id) ON DELETE CASCADE,
    status                     public.shipment_tracking_enum NOT NULL,
    description                TEXT,
    event_time                 TIMESTAMP                     NOT NULL,
    source                     public.shipment_tracking_enum, -- COURIER | SYSTEM | ADMIN
    created_at                 TIMESTAMP DEFAULT NOW()
);
