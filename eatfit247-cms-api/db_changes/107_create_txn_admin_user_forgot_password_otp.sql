-- Create table for Admin User Forgot Password OTP
-- This table stores OTP codes generated for password reset requests

DROP TABLE IF EXISTS txn_admin_user_forgot_password_otp;

CREATE TABLE IF NOT EXISTS txn_admin_user_forgot_password_otp
(
    forgot_password_otp_id SERIAL      NOT NULL PRIMARY KEY,
    admin_id               INT         NOT NULL,
    otp                    VARCHAR(6)  NOT NULL,
    active                 BOOLEAN     NOT NULL DEFAULT true,
    created_at             TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_ip             VARCHAR(50) NULL,
    CONSTRAINT fk_txn_admin_user_forgot_password_otp_mst_admin_admin_id
        FOREIGN KEY (admin_id) REFERENCES mst_admin_users (admin_id)
);

-- Create index on admin_id for faster lookups
CREATE INDEX ix_txn_admin_user_forgot_password_otp_admin_id
    ON txn_admin_user_forgot_password_otp (admin_id);

-- Create index on active and admin_id for querying active OTPs
CREATE INDEX ix_txn_admin_user_forgot_password_otp_active_admin
    ON txn_admin_user_forgot_password_otp (admin_id, active);

-- Create index on created_at for OTP expiration queries
CREATE INDEX ix_txn_admin_user_forgot_password_otp_created_at
    ON txn_admin_user_forgot_password_otp (created_at);

-- Create composite index for finding active OTP by admin_id and otp
CREATE INDEX ix_txn_admin_user_forgot_password_otp_admin_otp_active
    ON txn_admin_user_forgot_password_otp (admin_id, otp, active);

alter table public.mst_configs
    drop column field_type_id;

alter table public.mst_configs
    add column module varchar(20);

create table public.mst_label
(
    label_id      SERIAL                 NOT NULL PRIMARY KEY,
    label_key     character varying(100) not null,
    label         text,
    applicability character varying(10)
);
create unique index mst_label_label_key_applicability_uindex on mst_label using btree (label_key, applicability);


alter table txn_blogs
    add column meta_title varchar(60);
alter table txn_blogs
    add column meta_description varchar(160);

alter table mst_programs
    add column meta_title varchar(60);
alter table mst_programs
    add column meta_description varchar(160);

alter table mst_recipes
    add column meta_title varchar(60);
alter table mst_recipes
    add column meta_description varchar(160);

DROP TABLE IF EXISTS txn_admin_refresh_tokens;

CREATE TABLE IF NOT EXISTS txn_admin_refresh_tokens
(
    admin_refresh_token_id SERIAL      NOT NULL PRIMARY KEY,
    admin_id               INT         NOT NULL,
    token_hash             TEXT        NOT NULL,
    expires_at             date        not null,
    revoked                boolean     not null default false,
    created_at             TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_ip             VARCHAR(50) NULL,
    CONSTRAINT fk_txn_admin_password_reset_tokens_admin_id
        FOREIGN KEY (admin_id) REFERENCES mst_admin_users (admin_id)
);

DROP TABLE IF EXISTS txn_admin_password_reset_tokens;

CREATE TABLE IF NOT EXISTS txn_admin_password_reset_tokens
(
    admin_password_reset_token_id SERIAL      NOT NULL PRIMARY KEY,
    admin_id                      INT         NOT NULL,
    token_hash                    TEXT        NOT NULL,
    user_agent                    text,
    expires_at                    date        not null,
    used                          boolean     not null default false,
    created_at                    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_ip                    VARCHAR(50) NULL,
    CONSTRAINT fk_txn_admin_password_reset_tokens_admin_id
        FOREIGN KEY (admin_id) REFERENCES mst_admin_users (admin_id)
);

INSERT INTO public.mst_configs (config_id, config_name, config_value, module)
VALUES (DEFAULT, 'JWT_ACCESS_SECRET', 'GrdlksuiFEFjbwiuwkjbcwfdkjhsa&UFehjc7iuidy3jn89dy478', 'Auth');

INSERT INTO public.mst_configs (config_id, config_name, config_value, module)
VALUES (DEFAULT, 'JWT_REFRESH_SECRET', 'GrdlksuiFEFjbwiuwkjbcwfdkjhsa&dkldg74682jsadkfly478', 'Auth');

alter table public.mst_email_templates
    alter column body type varchar(100) using body::varchar(100);

INSERT INTO public.mst_configs (config_id, config_name, config_value, module)
VALUES (DEFAULT, 'CLIENT_URL', 'http://localhost:4200', 'Common');

INSERT INTO public.mst_configs (config_id, config_name, config_value, module)
VALUES (DEFAULT, 'SYSTEM_EMAIL_USER', 'info@eatfit247.com', 'Email'),
       (DEFAULT, 'SYSTEM_EMAIL_PASSWORD', 'shweta@123456789', 'Email'),
       (DEFAULT, 'SYSTEM_EMAIL_HOST', 'server.eatfit247.com', 'Email'),
       (DEFAULT, 'SYSTEM_EMAIL_ENABLE', 'true', 'Email'),
       (DEFAULT, 'SYSTEM_EMAIL_PORT', '587', 'Email');

INSERT INTO public.mst_configs (config_id, config_name, config_value, module)
VALUES (DEFAULT, 'CLIENT_URL', 'localhost:4200', 'Common');

alter table public.log_errors
    alter column environment type varchar(250) using environment::varchar(250);

alter table public.log_errors
    alter column browser type varchar(250) using browser::varchar(250);

alter table public.log_errors
    alter column host_url type text using host_url::text;

alter table public.log_errors
    alter column server_name type varchar(250) using server_name::varchar(250);

alter table public.log_errors
    alter column controller type varchar(250) using controller::varchar(250);

alter table public.log_errors
    alter column method_name type varchar(250) using method_name::varchar(250);

alter table public.log_errors
    alter column exception_type type varchar(250) using exception_type::varchar(250);

alter table public.log_errors
    alter column exception_source type varchar(250) using exception_source::varchar(250);

alter table public.txn_admin_password_reset_tokens
    alter column expires_at type timestamptz using expires_at::timestamptz;

create type public.banner_for as enum ('home', 'about_us', 'program', 'product', 'quiz', 'media_press', 'success_stories', 'blogs', 'contact_us', 'about_shweta','our_program','product','quiz_dosha','quiz_immunity');

create table public.txn_banner
(
    banner_id       SERIAL                      NOT NULL PRIMARY KEY,
    title           character varying(100)      not null,
    image_path      jsonb                       not null,
    active          boolean                     not null default true,
    created_at      timestamp without time zone not null default CURRENT_TIMESTAMP,
    updated_at      timestamp without time zone not null default CURRENT_TIMESTAMP,
    created_by      integer                     not null,
    updated_by      integer                     not null,
    sub_title       character varying(200),
    is_internal_url boolean                     not null default false,
    url             character varying(200),
    created_ip      character varying(50),
    modified_ip     character varying(50),
    banner_for      banner_for                  not null default 'home'::banner_for
);

create table public.txn_program_plan_fees
(
    program_plan_fees_id SERIAL                      NOT NULL PRIMARY KEY,
    program_plan_id      INT                         NOT NULL,
    currency_code        varchar(100)                not null,
    fees                 double precision            not null,
    active               boolean                     not null default true,
    created_at           timestamp without time zone not null default CURRENT_TIMESTAMP,
    updated_at           timestamp without time zone not null default CURRENT_TIMESTAMP,
    created_by           integer                     not null,
    updated_by           integer                     not null,
    created_ip           character varying(50),
    modified_ip          character varying(50),
    CONSTRAINT fk_txn_program_plan_fees_mst_program_plans_program_plan_id
        FOREIGN KEY (program_plan_id) REFERENCES mst_program_plans (program_plan_id),
    CONSTRAINT fk_txn_program_plan_fees_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_txn_program_plan_fees_mst_admin_updated_by FOREIGN KEY (updated_by) REFERENCES mst_admin_users (admin_id)
);

create unique index txn_program_plan_fees_currency_fees_uindex on public.txn_program_plan_fees using btree (program_plan_id, currency_code);

insert into txn_program_plan_fees
(program_plan_id, currency_code, fees, active, created_at,
 updated_at, created_by, updated_by, created_ip, modified_ip)
select program_plan_id,
       'INR',
       inr_amount,
       true,
       created_at,
       updated_at,
       created_by,
       modified_by,
       created_ip,
       modified_ip
from mst_program_plans;

create table public.mst_currencies
(
    currency_id   SERIAL       NOT NULL PRIMARY KEY,
    currency_code VARCHAR(10)  NOT NULL,
    label         varchar(100) not null,
    symbol        varchar(10)  not null
);

CREATE INDEX ix_mst_currencies_currency_code
    ON mst_currencies (currency_code);

alter table public.mst_program_plans
    drop column inr_amount;

alter table public.mst_program_plans
    drop column tags;

alter table public.mst_referrers
    drop column postal_address;

alter table public.mst_referrers
    drop column state_id;

alter table public.mst_referrers
    drop column country_id;

alter table public.mst_referrers
    drop column pin_code;

alter table public.mst_admin_users
    drop column admin_user_status_id;

alter table public.mst_admin_users
    add active boolean default true not null;

alter table public.txn_members
    drop column user_status_id;

alter table public.txn_members
    add active boolean default true not null;

alter table public.txn_program_plan_fees
    rename to mst_program_plan_fees;

alter table public.txn_diet_templates
    drop column is_weekly;

ALTER TABLE public.txn_member_call_logs
    ADD COLUMN nutrinist_id        integer
        REFERENCES public.mst_admin_users (admin_id),

    ADD COLUMN meeting_link        text,

    ADD COLUMN calendar_event_id   text,

    ADD COLUMN is_system_generated boolean
        DEFAULT false;

ALTER TABLE public.mst_admin_users
    ADD COLUMN google_calendar_email   varchar(255),
    ADD COLUMN google_refresh_token    text,
    ADD COLUMN google_token_scope      varchar(255),
    ADD COLUMN google_token_created_at timestamptz;

ALTER TABLE public.mst_admin_users
    ADD COLUMN google_calendar_timezone varchar(100);

INSERT INTO public.mst_configs (config_id, config_name, config_value, module)
VALUES (DEFAULT, 'GOOGLE_CLIENT_ID', '',
        'Google');
INSERT INTO public.mst_configs (config_id, config_name, config_value, module)
VALUES (DEFAULT, 'GOOGLE_CLIENT_SECRET', '', 'Google');
INSERT INTO public.mst_configs (config_id, config_name, config_value, module)
VALUES (DEFAULT, 'GOOGLE_REDIRECT_URI', 'http://localhost:3001/api/v2/admin/google-calendar/callback', 'Google');
INSERT INTO public.mst_configs (config_id, config_name, config_value, module)
VALUES (DEFAULT, 'GOOGLE_CALENDAR_SCOPE', 'https://www.googleapis.com/auth/calendar', 'Google');

INSERT INTO public.mst_configs (config_id, config_name, config_value, module)
VALUES (DEFAULT, 'CALENDAR_SLOT_STEP_MINUTES', 15, 'Calendar');
INSERT INTO public.mst_configs (config_id, config_name, config_value, module)
VALUES (DEFAULT, 'CALENDAR_MAX_SLOT', 10, 'Calendar');
INSERT INTO public.mst_configs (config_id, config_name, config_value, module)
VALUES (DEFAULT, 'CALENDAR_WORKING_HOURS', '09:00-18:00', 'Calendar');
INSERT INTO public.mst_configs (config_id, config_name, config_value, module)
VALUES (DEFAULT, 'CALENDAR_TIMEZONE', 'Asia/Kolkata', 'Calendar');

alter table public.txn_member_call_logs
    drop column start_time;
alter table public.txn_member_call_logs
    drop column end_time;
alter table public.txn_member_call_logs
    add column start_time timestamp with time zone;

alter table public.txn_member_call_logs
    add column end_time timestamp with time zone;

alter table public.txn_member_call_logs
    alter column detail type jsonb using detail::jsonb;

alter table public.txn_member_call_logs
    alter column is_system_generated set default true;

alter table public.txn_member_call_logs
    drop constraint fk_txn_member_call_logs_mst_call_log_statuses_id;

alter table public.txn_member_call_logs
    add constraint fk_txn_member_call_logs_mst_call_log_statuses_id
        foreign key (call_log_status_id) references public.mst_call_log_status;

INSERT INTO public.mst_configs (config_id, config_name, config_value, module)
VALUES (DEFAULT, 'ZOOM_ACCOUNT_ID', '', 'Zoom'),
       (DEFAULT, 'ZOOM_CLIENT_ID', '', 'Zoom'),
       (DEFAULT, 'ZOOM_CLIENT_SECRET', '', 'Zoom');

alter table public.mst_payment_statuses
    rename to mst_payment_status;

ALTER TABLE txn_member_payments
    ADD COLUMN payment_source     varchar(30) DEFAULT 'MANUAL',
    ADD COLUMN gateway_provider   varchar(50),
    ADD COLUMN gateway_order_id   varchar(100),
    ADD COLUMN gateway_payment_id varchar(100),
    ADD COLUMN payment_link       varchar(500);

INSERT INTO public.mst_payment_status (payment_status_id, payment_status, active, created_at, created_by, updated_at,
                                       modified_by, created_ip, modified_ip)
VALUES (4, 'FAILED', true, '2017-03-24 00:00:00.000000', 1, '2017-03-24 00:00:00.000000', 1, '0:', '0:')

INSERT INTO public.mst_configs (config_id, config_name, config_value, module)
VALUES (DEFAULT, 'PAYMENT_MODE', 'LIVE', 'Payment');

UPDATE public.mst_configs
SET config_value = 'true'
WHERE config_name = 'GST_ENABLED';

alter table public.mst_countries
    add tax_type VARCHAR(20) default 'NONE' not null;
alter table public.mst_countries
    add default_tax_percentage NUMERIC(5, 2) default 0 not null;

alter table public.mst_states
    add tax_percentage NUMERIC(5, 2) default 0 not null;

CREATE TABLE txn_promo_codes
(
    promo_code_id    SERIAL PRIMARY KEY,
    code             VARCHAR(50) UNIQUE       NOT NULL,
    discount_type    VARCHAR(10)              NOT NULL CHECK (discount_type IN ('FLAT', 'PERCENT')),
    discount_value   NUMERIC(10, 2)           NOT NULL,
    max_discount     NUMERIC(10, 2),
    min_order_amount NUMERIC(10, 2),
    usage_limit      INT,
    used_count       INT                               DEFAULT 0,
    active           BOOLEAN                           DEFAULT TRUE,
    expires_at       TIMESTAMP WITH TIME ZONE,
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by       integer                  NOT NULL,
    modified_by      integer                  NOT NULL,
    created_ip       VARCHAR(50)              NULL,
    modified_ip      VARCHAR(50)              NULL,
    CONSTRAINT fk_txn_promo_codes_created_by_mst_admin_admin_id
        FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_txn_promo_codes_modified_by_mst_admin_admin_id
        FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);

alter table public.mst_franchises
    add vat_number varchar(100);

alter table public.mst_franchises
    add bank_account_id varchar(100);

alter table public.mst_franchises
    add payment_gateway_config_id integer;

alter table public.mst_franchises
    add brand_name varchar(100);

alter table public.mst_franchises
    add lut_number varchar(100);

comment on column public.mst_franchises.lut_number is 'Indian export';

CREATE TYPE public.international_tax_mode AS ENUM ('EXPORT_OF_SERVICE', 'LOCAL_FOREIGN_TAX');

alter table public.mst_franchises
    add international_tax_mode public.international_tax_mode;

create table if not exists public.mst_payment_gateway
(
    payment_gateway_id     SERIAL PRIMARY KEY,
    code                   varchar(50) not null,
    name                   varchar(50) not null,
    provider_country_code  varchar(3)  not null,
    supports_international BOOLEAN default false,
    supports_recurring     BOOLEAN default false,
    supports_refund        BOOLEAN default false,
    active                 boolean default false
);

comment on column public.mst_payment_gateway.code is 'RAZORPAY, STRIPE, CASHFREE, PAYPAL';
comment on column public.mst_payment_gateway.name is 'Razorpay, Stripe, etc.';
comment on column public.mst_payment_gateway.provider_country_code is 'IN, US, AE';

create table if not exists public.mst_franchise_payment_gateway
(
    franchise_payment_gateway_id SERIAL PRIMARY KEY,
    franchise_id                 integer                  not null,
    payment_gateway_id           integer                  not null,
    country_code                 VARCHAR(3)               NOT NULL,
    currency_code                VARCHAR(3)               NOT NULL,
    is_primary                   boolean                           default false,
    supports_domestic            BOOLEAN                           default true,
    supports_international       BOOLEAN                           default false,
    supports_emi                 BOOLEAN                           default false,
    supports_upi                 BOOLEAN                           default false,
    settlement_delay_days        integer                           default null,
    gateway_fee_percentage       double precision                  default null,
    active                       boolean                           default false,
    created_at                   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by                   integer                  NOT NULL,
    modified_by                  integer                  NOT NULL,
    created_ip                   VARCHAR(50)              NULL,
    modified_ip                  VARCHAR(50)              NULL,
    CONSTRAINT fk_mst_franchise_payment_gateway_created_by_mst_admin_admin_id
        FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_franchise_payment_gateway_modified_by_mst_admin_admin_id
        FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);

create table if not exists public.mst_payment_gateway_credentials
(
    payment_gateway_credential_id SERIAL PRIMARY KEY,
    franchise_payment_gateway_id  integer                  not null,
    api_key_encrypted             text                     not null,
    api_secret_encrypted          text                     not null,
    webhook_secret_encrypted      text                     not null,
    mode                          text                     not null,
    created_at                    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by                    integer                  NOT NULL,
    modified_by                   integer                  NOT NULL,
    created_ip                    VARCHAR(50)              NULL,
    modified_ip                   VARCHAR(50)              NULL,
    CONSTRAINT fk_mst_payment_gateway_cred_created_by_mst_admin_admin_id
        FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_payment_gateway_cred_modified_by_mst_admin_admin_id
        FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_payment_gateway_cred_fpg_id_mst_fpg
        FOREIGN KEY (franchise_payment_gateway_id) REFERENCES mst_franchise_payment_gateway (franchise_payment_gateway_id)
);

alter table public.txn_diet_templates
    drop column cycle_no;

alter table public.txn_diet_templates
    drop column day_no;

-- Add missing columns to mst_legal_pages table
-- These columns are required for SEO, media uploads, and URL management

ALTER TABLE mst_legal_pages
    ADD COLUMN IF NOT EXISTS image_path JSONB NULL;

ALTER TABLE mst_legal_pages
    ADD COLUMN IF NOT EXISTS tags TEXT[] NULL;

ALTER TABLE mst_legal_pages
    ADD COLUMN IF NOT EXISTS url TEXT NULL;

ALTER TABLE mst_legal_pages
    ADD COLUMN IF NOT EXISTS meta_title VARCHAR(60) NULL;

ALTER TABLE mst_legal_pages
    ADD COLUMN IF NOT EXISTS meta_description VARCHAR(160) NULL;

ALTER TABLE txn_banner
    ADD COLUMN IF NOT EXISTS image_position varchar(10) DEFAULT 'center';
ALTER TABLE txn_banner
    ADD COLUMN IF NOT EXISTS title_icon varchar(20) DEFAULT null;
ALTER TABLE txn_banner
    ADD COLUMN IF NOT EXISTS description text DEFAULT null;
ALTER TABLE txn_banner
    ADD COLUMN IF NOT EXISTS primary_action_text varchar(50) DEFAULT null;
ALTER TABLE txn_banner
    ADD COLUMN IF NOT EXISTS primary_action_url varchar(100) DEFAULT null;
ALTER TABLE txn_banner
    ADD COLUMN IF NOT EXISTS secondary_action_text varchar(50) DEFAULT null;
ALTER TABLE txn_banner
    ADD COLUMN IF NOT EXISTS secondary_action_url varchar(100) DEFAULT null;

alter table public.txn_banner
    drop column is_internal_url;

alter table public.txn_banner
    drop column url;

INSERT INTO public.mst_configs (config_id, config_name, config_value, module)
VALUES (DEFAULT, 'GOOGLE_PROJECT_ID', 'eatfit247-172005', 'Google');
INSERT INTO public.mst_configs (config_id, config_name, config_value, module)
VALUES (DEFAULT, 'GOOGLE_KEY', 'XYZ', 'Google');
INSERT INTO public.mst_configs (config_id, config_name, config_value, module)
VALUES (DEFAULT, 'YOUTUBE_CHANNEL_ID', 'UCif2j57srYKBbxlRdv9kEMQ', 'Google');

INSERT INTO public.mst_configs (config_id, config_name, config_value, module)
VALUES (DEFAULT, 'GOOGLE_RECAPTCHA_SITE_KEY', 'XYZ', 'Google');
INSERT INTO public.mst_configs (config_id, config_name, config_value, module)
VALUES (DEFAULT, 'GOOGLE_RECAPTCHA_SECRET_KEY', 'XYZ', 'Google');

alter table public.mst_franchises
    add is_default boolean default false not null;


create table public.txn_success_stories
(
    success_story_id SERIAL PRIMARY KEY,
    name             varchar(255)                not null,
    title            varchar(255)                null,
    date             date                        not null,
    description      text                        not null,
    image_path       jsonb                       not null,
    active           boolean                     not null default true,
    created_at       timestamp without time zone not null default CURRENT_TIMESTAMP,
    updated_at       timestamp without time zone not null default CURRENT_TIMESTAMP,
    created_by       integer                     not null,
    updated_by       integer                     not null,
    created_ip       character varying(50),
    modified_ip      character varying(50),
    CONSTRAINT fk_txn_success_stories_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_txn_success_stories_mst_admin_updated_by FOREIGN KEY (updated_by) REFERENCES mst_admin_users (admin_id)
);