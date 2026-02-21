DROP TABLE IF EXISTS mst_admin_roles;
CREATE TABLE IF NOT EXISTS mst_admin_roles
(
    role_id    SERIAL       NOT NULL PRIMARY KEY,
    role       VARCHAR(100) NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS mst_admin_users;
CREATE TABLE IF NOT EXISTS mst_admin_users
(
    admin_id             SERIAL        NOT NULL PRIMARY KEY,
    first_name           VARCHAR(50)   NOT NULL,
    last_name            VARCHAR(50)   NOT NULL,
    profile_picture      jsonb         NULL,
    password             text          NOT NULL,
    password_temp        text                   DEFAULT NULL,
    country_code         VARCHAR(5)    NOT NULL,
    contact_number       VARCHAR(16)   NOT NULL,
    email_id             VARCHAR(100)  NOT NULL,
    address_id           INT           NULL,
    start_date           TIMESTAMP     NOT NULL,
    end_date             TIMESTAMP     NULL,
    franchise_id         INT           NULL,
    admin_user_status_id INT           NOT NULL,
    deactivation_reason  varchar(1000) NULL     DEFAULT NULL,
    verification_code    TEXT          NULL     DEFAULT NULL,
    created_at           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by           INT           NULL,
    updated_at           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by          INT           NULL,
    created_ip           VARCHAR(50)   NOT NULL,
    modified_ip          VARCHAR(50)   NOT NULL,
    CONSTRAINT fk_mst_admin_users_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_admin_users_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);

CREATE INDEX ix_mst_admin_users_email
    ON mst_admin_users (email_id);

CREATE INDEX ix_uq_mst_admin_users_email
    ON mst_admin_users (email_id);

CREATE INDEX ix_uq_mst_admin_users_contact_number
    ON mst_admin_users (contact_number);

DROP TABLE IF EXISTS mst_admin_role_permissions;
CREATE TABLE IF NOT EXISTS mst_admin_role_permissions
(
    admin_role_permission_id SERIAL      NOT NULL PRIMARY KEY,
    role_id                  INT         NOT NULL,
    admin_id                 INT         NOT NULL,
    active                   BOOLEAN     NULL     DEFAULT true,
    created_at               TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by               INT         NOT NULL,
    updated_at               TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by              INT         NOT NULL,
    created_ip               VARCHAR(50) NOT NULL,
    modified_ip              VARCHAR(50) NOT NULL,
    CONSTRAINT fk_mst_admin_role_permission_mst_admin_admin_id FOREIGN KEY (admin_id) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_admin_role_permission_mst_admin_role_role_id FOREIGN KEY (role_id) REFERENCES mst_admin_roles (role_id)
);

CREATE INDEX ix_mst_admin_role_permission_admin_id
    ON mst_admin_role_permissions (admin_id);


DROP TABLE IF EXISTS txn_admin_last_login_details;
CREATE TABLE IF NOT EXISTS txn_admin_last_login_details
(
    admin_last_login_detail_id SERIAL      NOT NULL PRIMARY KEY,
    admin_id                   INT         NOT NULL,
    device_detail              jsonb       NOT NULL,
    last_login_timestamp       TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_latest                  BOOLEAN     NOT NULL DEFAULT true,
    created_ip                 VARCHAR(50) NOT NULL,
    CONSTRAINT fk_txn_admin_last_login_detail_mst_admin_admin_id FOREIGN KEY (admin_id) REFERENCES mst_admin_users (admin_id)
);

CREATE INDEX ix_txn_admin_last_login_details_admin_id
    ON txn_admin_last_login_details (admin_id);

DROP TABLE IF EXISTS mst_countries;
CREATE TABLE IF NOT EXISTS mst_countries
(
    country_id        SERIAL       NOT NULL PRIMARY KEY,
    country           VARCHAR(100) NOT NULL,
    country_code      VARCHAR(5)   NULL,
    phone_number_code VARCHAR(5)   NULL     DEFAULT NULL,
    active            BOOLEAN      NULL     DEFAULT true,
    created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by        INT          NOT NULL,
    updated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by       INT          NOT NULL,
    created_ip        VARCHAR(50)  NOT NULL,
    modified_ip       VARCHAR(50)  NOT NULL,
    CONSTRAINT fk_mst_countries_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_countries_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);

DROP TABLE IF EXISTS mst_states;
CREATE TABLE IF NOT EXISTS mst_states
(
    state_id    SERIAL       NOT NULL PRIMARY KEY,
    state       VARCHAR(100) NOT NULL,
    code        VARCHAR(10)  NOT NULL,
    country_id  INT          NOT NULL,
    active      BOOLEAN      NULL     DEFAULT true,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by  INT          NOT NULL,
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by INT          NOT NULL,
    created_ip  VARCHAR(50)  NOT NULL,
    modified_ip VARCHAR(50)  NOT NULL,
    CONSTRAINT fk_mst_state_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_state_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_state_mst_countries_country_id FOREIGN KEY (country_id) REFERENCES mst_countries (country_id)
);

DROP TABLE IF EXISTS mst_franchises;
CREATE TABLE IF NOT EXISTS mst_franchises
(
    franchise_id             SERIAL       NOT NULL PRIMARY KEY,
    company_name             VARCHAR(100) NOT NULL,
    logo                     jsonb        NOT NULL,
    first_name               VARCHAR(50)  NOT NULL,
    last_name                VARCHAR(50)  NOT NULL,
    email_id                 VARCHAR(100) NOT NULL,
    alternate_email_id       VARCHAR(100) NOT NULL,
    contact_number           VARCHAR(16)  NOT NULL,
    alternate_contact_number VARCHAR(16)  NOT NULL,
    pan_number               VARCHAR(20)  NOT NULL,
    tan_number               VARCHAR(20)  NOT NULL,
    gst_number               VARCHAR(50)  NOT NULL,
    start_date               DATE         NOT NULL,
    end_date                 DATE         NULL     DEFAULT NULL,
    is_primary               BOOLEAN      NOT NULL DEFAULT false,
    active                   BOOLEAN      NULL     DEFAULT true,
    created_at               TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by               INT          NOT NULL,
    updated_at               TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by              INT          NOT NULL,
    created_ip               VARCHAR(50)  NOT NULL,
    modified_ip              VARCHAR(50)  NOT NULL,
    CONSTRAINT fk_mst_franchise_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_franchise_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);

alter table mst_admin_users
    add constraint mst_admin_users_mst_franchises_null_fk
        foreign key (franchise_id) references mst_franchises (franchise_id);

CREATE INDEX ix_uq_mst_franchise_email
    ON mst_franchises (email_id);

