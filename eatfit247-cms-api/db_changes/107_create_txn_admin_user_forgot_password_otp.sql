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
VALUES
    (DEFAULT, 'SYSTEM_EMAIL_USER', 'info@eatfit247.com', 'Email'),
    (DEFAULT, 'SYSTEM_EMAIL_PASSWORD', 'shweta@123456789', 'Email'),
    (DEFAULT, 'SYSTEM_EMAIL_HOST', 'server.eatfit247.com', 'Email'),
    (DEFAULT, 'SYSTEM_EMAIL_ENABLE', 'true', 'Email'),
    (DEFAULT, 'SYSTEM_EMAIL_PORT', '587', 'Email');

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
