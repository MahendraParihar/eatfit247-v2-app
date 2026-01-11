create table public.txn_member_products
(
    member_product_id        serial
        primary key,
    member_id                integer                   not null
        constraint fk_txn_member_product_txn_member_member_id
            references public.txn_members,
    payment_mode_id          integer
        constraint fk_txn_member_product_mst_payment_mode_id
            references public.mst_payment_modes,
    address_id               integer
        constraint fk_txn_member_product_txn_member_address_id
            references public.txn_addresses,
    transaction_id           varchar(250),
    payment_date             date                      not null,
    invoice_id               varchar(100),
    payment_status_id        integer                   not null
        constraint fk_txn_member_product_mst_payment_statuses_id
            references public.mst_payment_status,
    promo_code               varchar(100) default NULL::character varying,
    is_tax_applicable        boolean                   not null,
    payment_obj              jsonb                     not null,
    refund_obj               jsonb,
    payment_gateway_response jsonb,
    active                   boolean      default true not null,
    created_by               integer
        constraint fk_txn_member_product_mst_admin_created_by
            references public.mst_admin_users,
    created_at               timestamp with time zone  not null,
    modified_by              integer
        constraint fk_txn_member_product_mst_admin_modified_by
            references public.mst_admin_users,
    updated_at               timestamp with time zone  not null,
    created_ip               varchar(255)              not null,
    modified_ip              varchar(255)              not null,
    gst_number               varchar(50),
    billing_address_id       integer
        constraint txn_member_products_txn_addresses_address_id_fk
            references public.txn_addresses,
    payment_source           varchar(30)  default 'MANUAL'::character varying,
    gateway_provider         varchar(50),
    gateway_order_id         varchar(100),
    gateway_payment_id       varchar(100),
    payment_link             varchar(500)
);

alter table public.txn_member_products
    owner to eatfit;

create index ix_txn_member_product_member_id
    on public.txn_member_products (member_id);

create unique index ix_uk_txn_member_product_invoice_id
    on public.txn_member_products (invoice_id);


INSERT INTO public.mst_configs (config_id, config_name, config_value, module)
VALUES (DEFAULT, 'WOOCOMMERCE_BASE_URL', 'XYZ', 'WooCommerce');
INSERT INTO public.mst_configs (config_id, config_name, config_value, module)
VALUES (DEFAULT, 'WOOCOMMERCE_CONSUMER_KEY', 'XYZ', 'WooCommerce');
INSERT INTO public.mst_configs (config_id, config_name, config_value, module)
VALUES (DEFAULT, 'WOOCOMMERCE_CONSUMER_SECRET', 'XYZ', 'WooCommerce');
INSERT INTO public.mst_configs (config_id, config_name, config_value, module)
VALUES (DEFAULT, 'WOOCOMMERCE_API_VERSION', 'v3', 'WooCommerce');