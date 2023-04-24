DROP TABLE IF EXISTS mst_program_categories;
CREATE TABLE IF NOT EXISTS mst_program_categories
(
    program_category_id SERIAL       NOT NULL PRIMARY KEY,
    program_category    VARCHAR(100) NOT NULL,
    image_path          jsonb        NULL,
    url                 VARCHAR(250) NULL     DEFAULT NULL,
    active              BOOLEAN      NULL     DEFAULT true,
    created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by          INT          NOT NULL,
    updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by         INT          NOT NULL,
    created_ip          VARCHAR(50)  NOT NULL,
    modified_ip         VARCHAR(50)  NOT NULL,
    CONSTRAINT fk_mst_program_category_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_program_category_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);

DROP TABLE IF EXISTS mst_program_plan_types;
CREATE TABLE IF NOT EXISTS mst_program_plan_types
(
    program_plan_type_id SERIAL       NOT NULL PRIMARY KEY,
    program_plan_type    VARCHAR(100) NOT NULL,
    active               BOOLEAN      NULL     DEFAULT true,
    created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by           INT          NOT NULL,
    updated_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by          INT          NOT NULL,
    created_ip           VARCHAR(50)  NOT NULL,
    modified_ip          VARCHAR(50)  NOT NULL,
    CONSTRAINT fk_mst_program_plan_type_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_program_plan_type_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);

DROP TABLE IF EXISTS mst_programs;
CREATE TABLE IF NOT EXISTS mst_programs
(
    program_id          SERIAL        NOT NULL PRIMARY KEY,
    program             VARCHAR(100)  NOT NULL,
    program_category_id INT           NOT NULL,
    url                 VARCHAR(250)  NOT NULL,
    punch_line          VARCHAR(250)  NOT NULL,
    details             text          NOT NULL,
    image_path          jsonb         NOT NULL,
    ideal_for           varchar(50)   NULL,
    sequence_number     INT           NOT NULL,
    is_special_program  boolean       NOT NULL default false,
    video_url           varchar(500)  NULL,
    tags                varchar(1000) NULL,
    active              BOOLEAN       NULL     DEFAULT true,
    created_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by          INT           NOT NULL,
    updated_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by         INT           NOT NULL,
    created_ip          VARCHAR(50)   NOT NULL,
    modified_ip         VARCHAR(50)   NOT NULL,
    CONSTRAINT fk_mst_program_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_program_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_program_mst_program_category_program_category_id FOREIGN KEY (program_category_id) REFERENCES mst_program_categories (program_category_id)
);

DROP TABLE IF EXISTS mst_program_plans;
CREATE TABLE IF NOT EXISTS mst_program_plans
(
    program_plan_id      SERIAL           NOT NULL PRIMARY KEY,
    plan                 VARCHAR(100)     NOT NULL,
    url                  VARCHAR(250)     NOT NULL,
    details              text             NULL,
    image_path           jsonb            NULL,
    tags                 varchar(1000)    NULL,
    sequence_number      INT              NOT NULL,
    inr_amount           DOUBLE PRECISION NOT NULL,
    no_of_cycle          INT              NOT NULL DEFAULT 1,
    no_of_days_in_cycle  INT              NOT NULL DEFAULT 1,
    program_plan_type_id INT              NOT NULL,
    is_online            BOOLEAN          NOT NULL DEFAULT true,
    is_visible_on_web    BOOLEAN          NOT NULL DEFAULT false,
    active               BOOLEAN          NULL     DEFAULT true,
    created_at           TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by           INT              NOT NULL,
    updated_at           TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by          INT              NOT NULL,
    created_ip           VARCHAR(50)      NOT NULL,
    modified_ip          VARCHAR(50)      NOT NULL,
    CONSTRAINT fk_mst_program_plan_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_program_plan_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_program_plan_mst_program_plan_type_p_p_t_id FOREIGN KEY (program_plan_type_id) REFERENCES mst_program_plan_types (program_plan_type_id)
);

DROP TABLE IF EXISTS txn_program_faq;
CREATE TABLE IF NOT EXISTS txn_program_faq
(
    program_faq_id SERIAL      NOT NULL PRIMARY KEY,
    program_id     int         NOT NULL,
    question       text        NOT NULL,
    answer         text,
    active         BOOLEAN     NULL     DEFAULT true,
    created_at     TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by     INT         NOT NULL,
    updated_at     TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by    INT         NOT NULL,
    created_ip     VARCHAR(50) NOT NULL,
    modified_ip    VARCHAR(50) NOT NULL,
    CONSTRAINT fk_txn_program_faq_mst_program_program_id FOREIGN KEY (program_id) REFERENCES mst_programs (program_id),
    CONSTRAINT fk_txn_program_faq_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_txn_program_faq_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);


DROP TABLE IF EXISTS txn_program_faqs;
CREATE TABLE IF NOT EXISTS txn_program_faqs
(
    program_faq_id SERIAL      NOT NULL PRIMARY KEY,
    program_id     integer     NOT NULL,
    question       text        NOT NULL,
    answer         text,
    active         BOOLEAN     NULL     DEFAULT true,
    created_at     TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by     INT         NOT NULL,
    updated_at     TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by    INT         NOT NULL,
    created_ip     VARCHAR(50) NOT NULL,
    modified_ip    VARCHAR(50) NOT NULL,
    CONSTRAINT fk_txn_program_faq_mst_program_program_id FOREIGN KEY (program_id) REFERENCES mst_programs (program_id),
    CONSTRAINT fk_txn_program_faq_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_txn_program_faq_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);
