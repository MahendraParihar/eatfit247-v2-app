DROP TABLE IF EXISTS mst_address_types;
CREATE TABLE IF NOT EXISTS mst_address_types
(
    address_type_id SERIAL      NOT NULL PRIMARY KEY,
    address_type    VARCHAR(50) NOT NULL,
    active          BOOLEAN     NULL     DEFAULT '1',
    created_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by      INT         NOT NULL,
    updated_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by     INT         NOT NULL,
    CONSTRAINT fk_mst_address_type_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_address_type_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);

DROP TABLE IF EXISTS mst_payment_modes;
CREATE TABLE IF NOT EXISTS mst_payment_modes
(
    payment_mode_id SERIAL       NOT NULL PRIMARY KEY,
    payment_mode    VARCHAR(100) NOT NULL,
    active          BOOLEAN      NULL     DEFAULT '1',
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by      INT          NOT NULL,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by     INT          NOT NULL,
    CONSTRAINT fk_mst_payment_mode_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_payment_mode_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);

DROP TABLE IF EXISTS mst_health_parameter_units;
CREATE TABLE IF NOT EXISTS mst_health_parameter_units
(
    health_parameter_unit_id SERIAL      NOT NULL PRIMARY KEY,
    health_parameter_unit    VARCHAR(50) NOT NULL,
    active                   BOOLEAN     NULL     DEFAULT '1',
    created_at               TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by               INT         NOT NULL,
    updated_at               TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by              INT         NOT NULL,
    created_ip               VARCHAR(50) NOT NULL,
    modified_ip              VARCHAR(50) NOT NULL,
    CONSTRAINT fk_mst_health_parameters_unit_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_health_parameters_unit_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);

DROP TABLE IF EXISTS mst_media_src;
CREATE TABLE IF NOT EXISTS mst_media_src
(
    media_src_id SERIAL      NOT NULL PRIMARY KEY,
    media_src    VARCHAR(50) NOT NULL,
    active       BOOLEAN     NULL     DEFAULT '1',
    created_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by   INT         NOT NULL,
    updated_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by  INT         NOT NULL,
    CONSTRAINT fk_mst_media_src_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_media_src_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);

DROP TABLE IF EXISTS mst_table;
CREATE TABLE IF NOT EXISTS mst_table
(
    table_id    SERIAL       NOT NULL PRIMARY KEY,
    table_name  VARCHAR(100) NOT NULL,
    active      BOOLEAN      NULL     DEFAULT '1',
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by  INT          NOT NULL,
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by INT          NOT NULL,
    CONSTRAINT fk_mst_table_src_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_table_src_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);

DROP TABLE IF EXISTS mst_media_type;
CREATE TABLE IF NOT EXISTS mst_media_type
(
    media_type_id SERIAL      NOT NULL PRIMARY KEY,
    media_type    VARCHAR(50) NOT NULL,
    active        BOOLEAN     NULL     DEFAULT '1',
    created_at    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by    INT         NOT NULL,
    updated_at    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by   INT         NOT NULL,
    CONSTRAINT fk_mst_media_type_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_media_type_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);

DROP TABLE IF EXISTS mst_referrers;
CREATE TABLE IF NOT EXISTS mst_referrers
(
    referrer_id              SERIAL       NOT NULL PRIMARY KEY,
    name                     VARCHAR(100) NOT NULL,
    company_name             VARCHAR(100) NULL     DEFAULT NULL,
    website_link             VARCHAR(100) NULL     DEFAULT NULL,
    logo                     jsonb        NOT NULL,
    franchise_id             INT          NOT NULL,
    email_id                 VARCHAR(50)  NOT NULL,
    alternate_email_id       VARCHAR(100) NOT NULL,
    contact_number           VARCHAR(16)  NOT NULL,
    alternate_contact_number VARCHAR(16)  NOT NULL,
    postal_address           varchar(100) NOT NULL,
    state_id                 INT          NULL     DEFAULT NULL,
    country_id               INT          NULL     DEFAULT NULL,
    pin_code                 VARCHAR(10)  NULL     DEFAULT NULL,
    pan_number               VARCHAR(20)  NULL     DEFAULT NULL,
    tan_number               VARCHAR(20)  NULL     DEFAULT NULL,
    gst_number               VARCHAR(50)  NULL     DEFAULT NULL,
    start_date               DATE         NULL     DEFAULT NULL,
    end_date                 DATE         NULL     DEFAULT NULL,
    active                   BOOLEAN      NULL     DEFAULT true,
    created_at               TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by               INT          NOT NULL,
    updated_at               TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by              INT          NOT NULL,
    created_ip               VARCHAR(50)  NOT NULL,
    modified_ip              VARCHAR(50)  NOT NULL,
    CONSTRAINT fk_mst_referrer_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_referrer_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_referrer_mst_state_state_id FOREIGN KEY (state_id) REFERENCES mst_states (state_id),
    CONSTRAINT fk_mst_referrer_mst_countries_country_id FOREIGN KEY (country_id) REFERENCES mst_countries (country_id),
    CONSTRAINT fk_mst_referrer_mst_franchise_franchise_id FOREIGN KEY (franchise_id) REFERENCES mst_franchises (franchise_id)
);

DROP TABLE IF EXISTS mst_legal_pages;
CREATE TABLE IF NOT EXISTS mst_legal_pages
(
    legal_pages_id SERIAL      NOT NULL PRIMARY KEY,
    title          varchar(50) NOT NULL,
    details        TEXT        NOT NULL,
    active         BOOLEAN     NULL     DEFAULT true,
    created_at     TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by     INT         NOT NULL,
    updated_at     TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by    INT         NOT NULL,
    created_ip     VARCHAR(50) NOT NULL,
    modified_ip    VARCHAR(50) NOT NULL,
    CONSTRAINT fk_mst_legal_pages_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_legal_pages_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);

DROP TABLE IF EXISTS mst_blood_sugars;
CREATE TABLE IF NOT EXISTS mst_blood_sugars
(
    blood_sugar_id SERIAL      NOT NULL PRIMARY KEY,
    blood_sugar    VARCHAR(50) NOT NULL,
    active         BOOLEAN     NULL     DEFAULT true,
    created_at     TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by     INT         NOT NULL,
    updated_at     TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by    INT         NOT NULL,
    created_ip     VARCHAR(50) NOT NULL,
    modified_ip    VARCHAR(50) NOT NULL,
    CONSTRAINT fk_mst_blood_sugar_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_blood_sugar_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);

DROP TABLE IF EXISTS mst_genders;
CREATE TABLE IF NOT EXISTS mst_genders
(
    gender_id   SERIAL      NOT NULL PRIMARY KEY,
    gender      VARCHAR(50) NOT NULL,
    active      BOOLEAN     NULL     DEFAULT true,
    created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by  INT         NOT NULL,
    updated_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by INT         NOT NULL,
    created_ip  VARCHAR(50) NOT NULL,
    modified_ip VARCHAR(50) NOT NULL,
    CONSTRAINT fk_mst_gender_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_gender_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);


DROP TABLE IF EXISTS mst_health_issues;
CREATE TABLE IF NOT EXISTS mst_health_issues
(
    health_issue_id SERIAL      NOT NULL PRIMARY KEY,
    health_issue    VARCHAR(50) NOT NULL,
    active          BOOLEAN     NULL     DEFAULT true,
    created_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by      INT         NOT NULL,
    updated_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by     INT         NOT NULL,
    created_ip      VARCHAR(50) NOT NULL,
    modified_ip     VARCHAR(50) NOT NULL,
    CONSTRAINT fk_mst_health_issues_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_health_issues_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);


DROP TABLE IF EXISTS mst_lifestyles;
CREATE TABLE IF NOT EXISTS mst_lifestyles
(
    lifestyle_id SERIAL      NOT NULL PRIMARY KEY,
    lifestyle    VARCHAR(50) NOT NULL,
    active       BOOLEAN     NULL     DEFAULT true,
    created_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by   INT         NOT NULL,
    updated_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by  INT         NOT NULL,
    created_ip   VARCHAR(50) NOT NULL,
    modified_ip  VARCHAR(50) NOT NULL,
    CONSTRAINT fk_mst_lifestyle_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_lifestyle_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);


DROP TABLE IF EXISTS mst_marital_statuses;
CREATE TABLE IF NOT EXISTS mst_marital_statuses
(
    marital_status_id SERIAL      NOT NULL PRIMARY KEY,
    marital_status    VARCHAR(50) NOT NULL,
    active            BOOLEAN     NULL     DEFAULT true,
    created_at        TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by        INT         NOT NULL,
    updated_at        TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by       INT         NOT NULL,
    created_ip        VARCHAR(50) NOT NULL,
    modified_ip       VARCHAR(50) NOT NULL,
    CONSTRAINT fk_mst_marital_status_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_marital_status_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);

DROP TABLE IF EXISTS mst_pocket_guides;
CREATE TABLE IF NOT EXISTS mst_pocket_guides
(
    pocket_guide_id SERIAL      NOT NULL PRIMARY KEY,
    pocket_guide    VARCHAR(50) NOT NULL,
    file_path       jsonb       NOT NULL,
    description     text        null,
    active          BOOLEAN     NULL     DEFAULT true,
    created_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by      INT         NOT NULL,
    updated_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by     INT         NOT NULL,
    created_ip      VARCHAR(50) NOT NULL,
    modified_ip     VARCHAR(50) NOT NULL,
    CONSTRAINT fk_mst_pocket_guide_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_pocket_guide_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);

DROP TABLE IF EXISTS mst_religions;
CREATE TABLE IF NOT EXISTS mst_religions
(
    religion_id SERIAL      NOT NULL PRIMARY KEY,
    religion    VARCHAR(50) NOT NULL,
    active      BOOLEAN     NULL     DEFAULT true,
    created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by  INT         NOT NULL,
    updated_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by INT         NOT NULL,
    created_ip  VARCHAR(50) NOT NULL,
    modified_ip VARCHAR(50) NOT NULL,
    CONSTRAINT fk_mst_religion_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_religion_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);


DROP TABLE IF EXISTS mst_sleeping_patterns;
CREATE TABLE IF NOT EXISTS mst_sleeping_patterns
(
    sleeping_pattern_id SERIAL      NOT NULL PRIMARY KEY,
    sleeping_pattern    VARCHAR(50) NOT NULL,
    active              BOOLEAN     NULL     DEFAULT true,
    created_at          TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by          INT         NOT NULL,
    updated_at          TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by         INT         NOT NULL,
    created_ip          VARCHAR(50) NOT NULL,
    modified_ip         VARCHAR(50) NOT NULL,
    CONSTRAINT fk_mst_sleeping_pattern_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_sleeping_pattern_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);


DROP TABLE IF EXISTS mst_type_of_exercises;
CREATE TABLE IF NOT EXISTS mst_type_of_exercises
(
    type_of_exercise_id SERIAL      NOT NULL PRIMARY KEY,
    type_of_exercise    VARCHAR(50) NOT NULL,
    active              BOOLEAN     NULL     DEFAULT true,
    created_at          TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by          INT         NOT NULL,
    updated_at          TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by         INT         NOT NULL,
    created_ip          VARCHAR(50) NOT NULL,
    modified_ip         VARCHAR(50) NOT NULL,
    CONSTRAINT fk_mst_type_of_exercise_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_type_of_exercise_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);


DROP TABLE IF EXISTS mst_urine_outputs;
CREATE TABLE IF NOT EXISTS mst_urine_outputs
(
    urine_output_id SERIAL      NOT NULL PRIMARY KEY,
    urine_output    VARCHAR(50) NOT NULL,
    active          BOOLEAN     NULL     DEFAULT true,
    created_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by      INT         NOT NULL,
    updated_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by     INT         NOT NULL,
    created_ip      VARCHAR(50) NOT NULL,
    modified_ip     VARCHAR(50) NOT NULL,
    CONSTRAINT fk_mst_urine_output_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_urine_output_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);


DROP TABLE IF EXISTS mst_eating_habits;
CREATE TABLE IF NOT EXISTS mst_eating_habits
(
    eating_habit_id SERIAL      NOT NULL PRIMARY KEY,
    eating_habit    VARCHAR(50) NOT NULL,
    active          BOOLEAN     NULL     DEFAULT true,
    created_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by      INT         NOT NULL,
    updated_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by     INT         NOT NULL,
    created_ip      VARCHAR(50) NOT NULL,
    modified_ip     VARCHAR(50) NOT NULL,
    CONSTRAINT fk_mst_eating_habit_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_eating_habit_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);


DROP TABLE IF EXISTS mst_health_parameters;
CREATE TABLE IF NOT EXISTS mst_health_parameters
(
    health_parameter_id SERIAL      NOT NULL PRIMARY KEY,
    health_parameter    VARCHAR(50) NOT NULL,
    hint_text           VARCHAR(50) NOT NULL,
    image_path          JSONB       NULL     DEFAULT NULL,
    is_length           BOOLEAN     NOT NULL DEFAULT true,
    sequence            INT         NOT NULL,
    field_type          varchar(10) NOT NULL,
    required_field      boolean     not null default false,
    active              BOOLEAN     NULL     DEFAULT true,
    created_at          TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by          INT         NOT NULL,
    updated_at          TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by         INT         NOT NULL,
    created_ip          VARCHAR(50) NOT NULL,
    modified_ip         VARCHAR(50) NOT NULL,
    CONSTRAINT fk_mst_health_parameter_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_health_parameter_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);

create index mst_health_parameters_sequence_index
    on mst_health_parameters (sequence);

DROP TABLE IF EXISTS mst_health_parameter_unit_mappings;
CREATE TABLE IF NOT EXISTS mst_health_parameter_unit_mappings
(
    health_parameter_unit_mapping_id SERIAL    NOT NULL PRIMARY KEY,
    health_parameter_unit_id         INTEGER   NOT NULL,
    health_parameter_id              INTEGER   NOT NULL,
    active                           BOOLEAN   NOT NULL DEFAULT TRUE,
    default_selected                 BOOLEAN,
    created_at                       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by                       INT       NOT NULL,
    updated_at                       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by                      INT       NOT NULL,
    CONSTRAINT fk_mst_health_parameter_unit_mappings_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_health_parameter_unit_mappings_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_health_parameter_unit_mappings_m_h_parameter_id_fk FOREIGN KEY (health_parameter_id) REFERENCES mst_health_parameters (health_parameter_id),
    CONSTRAINT fk_mst_health_parameter_unit_mappings_m_h_p_units_id_fk FOREIGN KEY (health_parameter_unit_id) REFERENCES mst_health_parameter_units (health_parameter_unit_id)
);

create index idx_mst_health_parameter_unit_mapping_h_p_id
    on mst_health_parameter_unit_mappings (health_parameter_id);
create unique index uq_idx_mst_health_parameter_unit_mapping_h_p_h_p_id
    on mst_health_parameter_unit_mappings (health_parameter_unit_id, health_parameter_id);


DROP TABLE IF EXISTS mst_plan_status;
CREATE TABLE IF NOT EXISTS mst_plan_status
(
    plan_status_id SERIAL      NOT NULL PRIMARY KEY,
    plan_status    VARCHAR(50) NOT NULL,
    active         BOOLEAN     NULL     DEFAULT true,
    created_at     TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by     INT         NOT NULL,
    updated_at     TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by    INT         NOT NULL,
    created_ip     VARCHAR(50) NOT NULL,
    modified_ip    VARCHAR(50) NOT NULL,
    CONSTRAINT fk_mst_plan_status_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_plan_status_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);


DROP TABLE IF EXISTS mst_call_log_status;
CREATE TABLE IF NOT EXISTS mst_call_log_status
(
    call_log_status_id SERIAL      NOT NULL PRIMARY KEY,
    call_log_status    VARCHAR(50) NOT NULL,
    active             BOOLEAN     NULL     DEFAULT true,
    created_at         TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by         INT         NOT NULL,
    updated_at         TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by        INT         NOT NULL,
    created_ip         VARCHAR(50) NOT NULL,
    modified_ip        VARCHAR(50) NOT NULL,
    CONSTRAINT fk_mst_call_log_status_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_call_log_status_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);


DROP TABLE IF EXISTS mst_call_purposes;
CREATE TABLE IF NOT EXISTS mst_call_purposes
(
    call_purpose_id SERIAL      NOT NULL PRIMARY KEY,
    call_purpose    VARCHAR(50) NOT NULL,
    active          BOOLEAN     NULL     DEFAULT true,
    created_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by      INT         NOT NULL,
    updated_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by     INT         NOT NULL,
    created_ip      VARCHAR(50) NOT NULL,
    modified_ip     VARCHAR(50) NOT NULL,
    CONSTRAINT fk_mst_call_purpose_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_call_purpose_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);

DROP TABLE IF EXISTS mst_call_types;
CREATE TABLE IF NOT EXISTS mst_call_types
(
    call_type_id SERIAL      NOT NULL PRIMARY KEY,
    call_type    VARCHAR(50) NOT NULL,
    active       BOOLEAN     NULL     DEFAULT true,
    created_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by   INT         NOT NULL,
    updated_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by  INT         NOT NULL,
    created_ip   VARCHAR(50) NOT NULL,
    modified_ip  VARCHAR(50) NOT NULL,
    CONSTRAINT fk_mst_call_type_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_call_type_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);

DROP TABLE IF EXISTS mst_currency_configs;
CREATE TABLE IF NOT EXISTS mst_currency_configs
(
    currency_config_id              SERIAL           NOT NULL PRIMARY KEY,
    source_currency_code            VARCHAR(10)      NOT NULL,
    target_currency_code            VARCHAR(10)      NOT NULL,
    conversion_rate                 DOUBLE PRECISION NOT NULL DEFAULT 0,
    conversion_rate_fees_in_percent DOUBLE PRECISION NOT NULL DEFAULT 0,
    active                          BOOLEAN          NULL     DEFAULT true,
    created_at                      TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by                      INT              NOT NULL,
    updated_at                      TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by                     INT              NOT NULL,
    created_ip                      VARCHAR(50)      NOT NULL,
    modified_ip                     VARCHAR(50)      NOT NULL,
    CONSTRAINT fk_mst_currency_config_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_currency_config_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);

DROP TABLE IF EXISTS mst_call_log_statuses;
CREATE TABLE IF NOT EXISTS mst_call_log_statuses
(
    call_log_status_id SERIAL      NOT NULL PRIMARY KEY,
    call_log_status    VARCHAR(50) NOT NULL,
    active             BOOLEAN     NULL     DEFAULT true,
    created_at         TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by         INT         NOT NULL,
    updated_at         TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by        INT         NOT NULL,
    created_ip         VARCHAR(50) NOT NULL,
    modified_ip        VARCHAR(50) NOT NULL,
    CONSTRAINT fk_mst_call_log_statuses_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_call_log_statuses_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);

DROP TABLE IF EXISTS mst_payment_statuses;
CREATE TABLE IF NOT EXISTS mst_payment_statuses
(
    payment_status_id SERIAL      NOT NULL PRIMARY KEY,
    payment_status    VARCHAR(50) NOT NULL,
    active            BOOLEAN     NULL     DEFAULT true,
    created_at        TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by        INT         NOT NULL,
    updated_at        TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by       INT         NOT NULL,
    created_ip        VARCHAR(50) NOT NULL,
    modified_ip       VARCHAR(50) NOT NULL,
    CONSTRAINT fk_mst_payment_status_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_payment_status_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);

DROP TABLE IF EXISTS mst_field_types;
CREATE TABLE IF NOT EXISTS mst_field_types
(
    field_type_id SERIAL       NOT NULL PRIMARY KEY,
    field_type    VARCHAR(100) NOT NULL
);
