DROP TABLE IF EXISTS txn_subscribers;
CREATE TABLE IF NOT EXISTS txn_subscribers
(
    subscriber_id SERIAL       NOT NULL PRIMARY KEY,
    name          VARCHAR(100) NULL,
    email_id      VARCHAR(100) NOT NULL,
    is_subscribe  boolean               default true,
    active        BOOLEAN      NULL     DEFAULT true,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_ip    VARCHAR(50)  NOT NULL,
    modified_ip   VARCHAR(50)  NOT NULL
);

CREATE UNIQUE INDEX ix_txn_subscriber_email_id
    ON txn_subscribers (email_id);

DROP TABLE IF EXISTS txn_contact_forms;
CREATE TABLE IF NOT EXISTS txn_contact_forms
(
    contact_form_id   SERIAL        NOT NULL PRIMARY KEY,
    name              VARCHAR(100)  NOT NULL,
    email_id          VARCHAR(100)  NOT NULL,
    country_code      VARCHAR(5)    NOT NULL,
    contact_number    VARCHAR(20)   NOT NULL,
    message           VARCHAR(1000) NOT NULL,
    responded_by      INT           NULL     DEFAULT NULL,
    responded_message VARCHAR(1000) NULL     DEFAULT NULL,
    active            BOOLEAN       NULL     DEFAULT true,
    created_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_ip        VARCHAR(50)   NOT NULL,
    modified_ip       VARCHAR(50)   NOT NULL,
    CONSTRAINT fk_txn_contact_form_response_mst_admin_responded_by FOREIGN KEY (responded_by) REFERENCES mst_admin_users (admin_id)
);

DROP TABLE IF EXISTS txn_promotion_mails;
CREATE TABLE IF NOT EXISTS txn_promotion_mails
(
    promotion_mail_id SERIAL       NOT NULL PRIMARY KEY,
    title             VARCHAR(500) NOT NULL,
    subject           VARCHAR(500) NOT NULL,
    body_text         TEXT         NOT NULL,
    file_path         VARCHAR(200) NOT NULL,
    image_path        jsonb        NULL     DEFAULT NULL,
    attachment_file   jsonb        NULL     DEFAULT NULL,
    active            BOOLEAN      NULL     DEFAULT true,
    created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by        INT          NOT NULL,
    updated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by       INT          NOT NULL,
    created_ip        VARCHAR(50)  NOT NULL,
    modified_ip       VARCHAR(50)  NOT NULL,
    CONSTRAINT fk_txn_promotion_mail_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_txn_promotion_mail_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);
