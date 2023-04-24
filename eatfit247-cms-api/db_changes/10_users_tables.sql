CREATE TYPE public.diet_type as ENUM ('CYCLE', 'DAY');

DROP TABLE IF EXISTS txn_addresses;
CREATE TABLE IF NOT EXISTS txn_addresses
(
    address_id      SERIAL       NOT NULL PRIMARY KEY,
    address_type_id INT          NOT NULL DEFAULT 1,
    table_id        INT          NOT NULL,
    pk_of_table     INT          NOT NULL,
    postal_address  varchar(200) NOT NULL,
    city_village    varchar(200) NULL,
    state_id        INT          NOT NULL,
    country_id      INT          NOT NULL,
    pin_code        varchar(10)  NULL,
    latitude        varchar(50)  NULL,
    longitude       varchar(50)  NULL,
    active          BOOLEAN      NULL     DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by      INT          NOT NULL,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by     INT          NOT NULL,
    created_ip      VARCHAR(50)  NOT NULL,
    modified_ip     VARCHAR(50)  NOT NULL,
    CONSTRAINT fk_txn_address_mst_tables_table_by FOREIGN KEY (table_id) REFERENCES mst_table (table_id),
    CONSTRAINT fk_txn_address_mst_address_type_address_type_by FOREIGN KEY (address_type_id) REFERENCES mst_address_types (address_type_id),
    CONSTRAINT fk_txn_address_mst_state_state_id FOREIGN KEY (state_id) REFERENCES mst_states (state_id),
    CONSTRAINT fk_txn_address_mst_country_country_id FOREIGN KEY (country_id) REFERENCES mst_countries (country_id),
    CONSTRAINT fk_txn_address_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_txn_address_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);

DROP TABLE IF EXISTS txn_members;
CREATE TABLE IF NOT EXISTS txn_members
(
    member_id           SERIAL        NOT NULL PRIMARY KEY,
    first_name          VARCHAR(50)   NOT NULL,
    last_name           VARCHAR(50)   NOT NULL,
    profile_picture     jsonb         NULL,
    password            text          NOT NULL,
    password_temp       text                   DEFAULT NULL,
    country_code        VARCHAR(5)    NOT NULL,
    contact_number      VARCHAR(16)   NOT NULL,
    email_id            VARCHAR(100)  NOT NULL,
    has_any_plan        BOOLEAN       NULL     DEFAULT false,
    referrer_id         INT           NULL,
    franchise_id        INT           NOT NULL,
    country_id          INT           NOT NULL,
    nutritionist_id     INT           NULL,
    user_status_id      INT           NOT NULL DEFAULT -1,
    deactivation_reason varchar(1000) NULL,
    created_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by          INT           NULL     DEFAULT NULL,
    updated_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by         INT           NULL     DEFAULT NULL,
    created_ip          VARCHAR(50)   NOT NULL,
    modified_ip         VARCHAR(50)   NOT NULL,
    CONSTRAINT fk_txn_member_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_txn_member_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_txn_member_mst_referrer_referrer_id FOREIGN KEY (referrer_id) REFERENCES mst_referrers (referrer_id),
    CONSTRAINT fk_txn_member_mst_franchises_franchises_id FOREIGN KEY (franchise_id) REFERENCES mst_franchises (franchise_id),
    CONSTRAINT fk_txn_member_mst_country_country_id FOREIGN KEY (country_id) REFERENCES mst_countries (country_id),
    CONSTRAINT fk_txn_member_mst_admin_user_nutritionist_id FOREIGN KEY (nutritionist_id) REFERENCES mst_admin_users (admin_id)
);

CREATE INDEX ix_txn_member_email
    ON txn_members (email_id);

CREATE INDEX ix_txn_member_first_name
    ON txn_members (first_name);

CREATE INDEX ix_txn_member_last_name
    ON txn_members (last_name);

CREATE INDEX ix_uq_txn_member_email
    ON txn_members (email_id);

DROP TABLE IF EXISTS txn_assessments;
CREATE TABLE IF NOT EXISTS txn_assessments
(
    assessment_id          SERIAL      NOT NULL PRIMARY KEY,
    member_id              INT         NOT NULL,
    address_id             INT         NULL,
    date_of_birth          date                 DEFAULT NULL,
    age                    INT                  DEFAULT NULL,
    gender_id              INT                  DEFAULT NULL,
    marital_status_id      INT                  DEFAULT NULL,
    religion_id            INT                  DEFAULT NULL,
    lifestyle_id           INT                  DEFAULT NULL,
    eating_habit_id        INT                  DEFAULT NULL,
    tobacco_amount         varchar(100)         DEFAULT NULL,
    tobacco_frequency      varchar(100)         DEFAULT NULL,
    paan                   varchar(100)         DEFAULT NULL,
    smoking_amount         varchar(100)         DEFAULT NULL,
    smoking_frequency      varchar(100)         DEFAULT NULL,
    alcohol_drink          varchar(100)         DEFAULT NULL,
    alcohol_frequency      varchar(100)         DEFAULT NULL,
    alcohol_amount         varchar(100)         DEFAULT NULL,
    aerated_drinks         varchar(100)         DEFAULT NULL,
    water_intake           varchar(100)         DEFAULT NULL,
    religious              varchar(100)         DEFAULT NULL,
    fasting                varchar(100)         DEFAULT NULL,
    restaurant_visit       varchar(100)         DEFAULT NULL,
    preferred_cuisine      varchar(100)         DEFAULT NULL,
    who_cooks              varchar(100)         DEFAULT NULL,
    hunger_peak            varchar(100)         DEFAULT NULL,
    food_dislikes          varchar(100)         DEFAULT NULL,
    other_food_preferences varchar(100)         DEFAULT NULL,
    do_you_exercise        varchar(100)         DEFAULT NULL,
    type_of_exercise_id    INT                  DEFAULT NULL,
    frequency              varchar(100)         DEFAULT NULL,
    duration               varchar(100)         DEFAULT NULL,
    time                   varchar(100)         DEFAULT NULL,
    allergies              varchar(100)         DEFAULT NULL,
    allergy_specify        varchar(100)         DEFAULT NULL,
    sleeping_pattern_id    INT                  DEFAULT NULL,
    sleep_duration         varchar(100)         DEFAULT NULL,
    gas                    varchar(100)         DEFAULT NULL,
    hyper_acidity          varchar(100)         DEFAULT NULL,
    constipation           varchar(100)         DEFAULT NULL,
    periods                varchar(100)         DEFAULT NULL,
    lmp                    varchar(100)         DEFAULT NULL,
    days_cycle             varchar(100)         DEFAULT NULL,
    hair_fall              varchar(100)         DEFAULT NULL,
    knee_pain              varchar(100)         DEFAULT NULL,
    back_pain              varchar(100)         DEFAULT NULL,
    blood_sugar_id         INT                  DEFAULT NULL,
    blood_sugar_value      varchar(250)         DEFAULT NULL,
    cholesterol            varchar(100)         DEFAULT NULL,
    triglycerides          varchar(100)         DEFAULT NULL,
    hdl_cholesterol        varchar(100)         DEFAULT NULL,
    ldl_cholesterol        varchar(100)         DEFAULT NULL,
    vldl_cholesterol       varchar(100)         DEFAULT NULL,
    hg_level               varchar(100)         DEFAULT NULL,
    urine_output_id        INT                  DEFAULT NULL,
    supplement_medicine    varchar(100)         DEFAULT NULL,
    wakeup_timing          varchar(100)         DEFAULT NULL,
    bf_menu                varchar(250)         DEFAULT NULL,
    bf_time                varchar(250)         DEFAULT NULL,
    mm_menu                varchar(250)         DEFAULT NULL,
    mm_time                varchar(250)         DEFAULT NULL,
    lunch_menu             varchar(250)         DEFAULT NULL,
    lunch_time             varchar(250)         DEFAULT NULL,
    eve_menu               varchar(250)         DEFAULT NULL,
    eve_time               varchar(250)         DEFAULT NULL,
    mid_eve_menu           varchar(250)         DEFAULT NULL,
    mid_eve_time           varchar(250)         DEFAULT NULL,
    dinner_menu            varchar(250)         DEFAULT NULL,
    dinner_time            varchar(250)         DEFAULT NULL,
    night_snacks           varchar(250)         DEFAULT NULL,
    bed_time               varchar(250)         DEFAULT NULL,
    fruits_frequency       varchar(250)         DEFAULT NULL,
    break_frequency        varchar(250)         DEFAULT NULL,
    bread_amount           varchar(250)         DEFAULT NULL,
    sweet_frequency        varchar(250)         DEFAULT NULL,
    sweet_amount           varchar(250)         DEFAULT NULL,
    tea_frequency          varchar(250)         DEFAULT NULL,
    tea_amount             varchar(250)         DEFAULT NULL,
    nutritionist_summery   varchar(2000)        DEFAULT NULL,
    remark                 varchar(2000)        DEFAULT NULL,
    created_at             TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by             INT         NULL     DEFAULT NULL,
    updated_at             TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by            INT         NULL     DEFAULT NULL,
    created_ip             VARCHAR(50) NOT NULL,
    modified_ip            VARCHAR(50) NOT NULL,
    CONSTRAINT fk_txn_assessment_txn_member_member_id FOREIGN KEY (member_id) REFERENCES txn_members (member_id),
    CONSTRAINT fk_txn_assessment_mst_gender_id FOREIGN KEY (gender_id) REFERENCES mst_genders (gender_id),
    CONSTRAINT fk_txn_assessment_mst_marital_status_id FOREIGN KEY (marital_status_id) REFERENCES mst_marital_statuses (marital_status_id),
    CONSTRAINT fk_txn_assessment_mst_religion_id FOREIGN KEY (religion_id) REFERENCES mst_religions (religion_id),
    CONSTRAINT fk_txn_assessment_mst_life_style_id FOREIGN KEY (lifestyle_id) REFERENCES mst_lifestyles (lifestyle_id),
    CONSTRAINT fk_txn_assessment_mst_eating_habit_id FOREIGN KEY (eating_habit_id) REFERENCES mst_eating_habits (eating_habit_id),
    CONSTRAINT fk_txn_assessment_mst_type_of_exercise_id FOREIGN KEY (type_of_exercise_id) REFERENCES mst_type_of_exercises (type_of_exercise_id),
    CONSTRAINT fk_txn_assessment_mst_sleeping_pattern_id FOREIGN KEY (sleeping_pattern_id) REFERENCES mst_sleeping_patterns (sleeping_pattern_id),
    CONSTRAINT fk_txn_assessment_mst_blood_sugar_id FOREIGN KEY (blood_sugar_id) REFERENCES mst_blood_sugars (blood_sugar_id),
    CONSTRAINT fk_txn_assessment_mst_urine_output_id FOREIGN KEY (urine_output_id) REFERENCES mst_urine_outputs (urine_output_id),
    CONSTRAINT fk_txn_assessment_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_txn_assessment_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);

CREATE INDEX ix_uq_txn_assessment_member_id
    ON txn_assessments (member_id);

DROP TABLE IF EXISTS txn_member_pocket_guides;
create table txn_member_pocket_guides
(
    member_pocket_guide_id serial primary key,
    member_id              integer                  not null,
    pocket_guide_id        integer                  not null,
    created_by             integer,
    created_at             timestamp with time zone not null,
    modified_by            integer,
    updated_at             timestamp with time zone not null,
    created_ip             varchar(255)             not null,
    modified_ip            varchar(255)             not null
);

ALTER TABLE txn_member_pocket_guides
    ADD CONSTRAINT fk_xn_member_pocket_guides_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    ADD CONSTRAINT fk_xn_member_pocket_guides_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id),
    ADD CONSTRAINT fk_txn_member_pocket_guides_txn_member_member_id FOREIGN KEY (member_id) REFERENCES txn_members (member_id),
    ADD CONSTRAINT fk_txn_member_pocket_guides_mst_pocket_guides_id FOREIGN KEY (pocket_guide_id) REFERENCES mst_pocket_guides (pocket_guide_id);

create unique index txn_member_pocket_guides_member_id_pocket_guide_id_uindex
    on txn_member_pocket_guides (member_id, pocket_guide_id);

create index ix_txn_member_pocket_guide_member_id
    on txn_member_pocket_guides (member_id);

DROP TABLE IF EXISTS txn_member_call_logs;
create table txn_member_call_logs
(
    member_call_log_id serial primary key,
    member_id          integer                  not null,
    date               date                     not null,
    start_time         time                     not null,
    end_time           time                     not null,
    call_type_id       integer                  not null,
    call_purpose_id    integer                  not null,
    call_log_status_id integer                  not null,
    detail             varchar(250),
    conversion_history varchar(250),
    is_mail_success    boolean default false    not null,
    active             boolean default true     not null,
    created_by         integer,
    created_at         timestamp with time zone not null,
    modified_by        integer,
    updated_at         timestamp with time zone not null,
    created_ip         varchar(255)             not null,
    modified_ip        varchar(255)             not null
);

create index ix_uq_txn_member_call_log_member_id
    on txn_member_call_logs (member_id);

create index ix_uq_txn_member_call_log_call_log_status_id
    on txn_member_call_logs (call_log_status_id);

ALTER TABLE txn_member_call_logs
    ADD CONSTRAINT fk_txn_member_call_logs_txn_members_id FOREIGN KEY (member_id) REFERENCES txn_members (member_id),
    ADD CONSTRAINT fk_txn_member_call_logs_mst_call_types_id FOREIGN KEY (call_type_id) REFERENCES mst_call_types (call_type_id),
    ADD CONSTRAINT fk_txn_member_call_logs_mst_call_purposes_id FOREIGN KEY (call_purpose_id) REFERENCES mst_call_purposes (call_purpose_id),
    ADD CONSTRAINT fk_txn_member_call_logs_mst_call_log_statuses_id FOREIGN KEY (call_log_status_id) REFERENCES mst_call_log_statuses (call_log_status_id);

DROP TABLE IF EXISTS txn_member_health_parameter_logs;
create table txn_member_health_parameter_logs
(
    member_health_parameter_log_id serial primary key,
    member_id                      integer                  not null,
    log_date                       date                     not null,
    active                         boolean default true     not null,
    created_by                     integer,
    created_at                     timestamp with time zone not null,
    modified_by                    integer,
    updated_at                     timestamp with time zone not null,
    created_ip                     varchar(255)             not null,
    modified_ip                    varchar(255)             not null
);

create unique index ix_uq_txn_member_health_parameter_logs_member_id_date
    on txn_member_health_parameter_logs (member_id, log_date);

ALTER TABLE txn_member_health_parameter_logs
    ADD CONSTRAINT fk_txn_member_health_parameter_logs_txn_member_id_by FOREIGN KEY (member_id) REFERENCES txn_members (member_id),
    ADD CONSTRAINT fk_txn_member_health_parameter_logs_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    ADD CONSTRAINT fk_txn_member_health_parameter_logs_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id);

DROP TABLE IF EXISTS txn_member_health_parameters;
create table txn_member_health_parameters
(
    member_health_parameter_id     serial primary key,
    member_health_parameter_log_id integer     not null,
    health_parameter_id            integer     not null,
    value                          varchar(20) not null,
    health_parameter_unit_id       integer     null
);

ALTER TABLE txn_member_health_parameters
    ADD CONSTRAINT fk_txn_member_health_parameters_txn_member_id_by FOREIGN KEY (member_health_parameter_log_id) REFERENCES txn_member_health_parameter_logs (member_health_parameter_log_id),
    ADD CONSTRAINT fk_txn_member_health_parameters_mst_health_parameter_id FOREIGN KEY (health_parameter_id) REFERENCES mst_health_parameters (health_parameter_id),
    ADD CONSTRAINT fk_txn_member_health_parameters_mst_health_parameter_units_id FOREIGN KEY (health_parameter_unit_id) REFERENCES mst_health_parameter_units (health_parameter_unit_id);

create unique index ix_uq_txn_member_health_parameters_member_id_hp_id
    on txn_member_health_parameters (member_health_parameter_log_id, health_parameter_id);

DROP TABLE IF EXISTS txn_member_health_issues;
create table txn_member_health_issues
(
    member_health_issue_id serial primary key,
    member_id              integer                  not null,
    health_issue_id        integer                  not null,
    created_by             integer,
    created_at             timestamp with time zone not null,
    modified_by            integer,
    updated_at             timestamp with time zone not null,
    created_ip             varchar(255)             not null,
    modified_ip            varchar(255)             not null
);

ALTER TABLE txn_member_health_issues
    ADD CONSTRAINT fk_txn_member_health_issue_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    ADD CONSTRAINT fk_txn_member_health_issue_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id),
    ADD CONSTRAINT fk_txn_member_health_issue_txn_member_member_id FOREIGN KEY (member_id) REFERENCES txn_members (member_id),
    ADD CONSTRAINT fk_txn_member_health_issue_mst_health_issues_id FOREIGN KEY (health_issue_id) REFERENCES mst_health_issues (health_issue_id);

create unique index ix_uq_txn_member_health_issue_mapping_hi_id
    on txn_member_health_issues (member_id, health_issue_id);

create index ix_txn_member_health_issue_mapping_member_id
    on txn_member_health_issues (member_id);

DROP TABLE IF EXISTS txn_member_payments;
create table txn_member_payments
(
    member_payment_id        serial primary key,
    member_id                integer                  not null,
    payment_mode_id          integer                  null,
    program_plan_id          integer                  not null,
    program_id               integer                  not null,
    address_id               integer                  null,
    transaction_id           varchar(250)             null,
    payment_date             date                     not null,
    invoice_id               varchar(100)             null,
    payment_status_id        integer                  not null,
    promo_code               varchar(100)             null     default null,
    is_tax_applicable        boolean                  not null,
    payment_obj              jsonb                    not null,
    refund_obj               jsonb                    null,
    payment_gateway_response jsonb                    null     default null,
    active                   boolean                  not null default true,
    created_by               integer,
    created_at               timestamp with time zone not null,
    modified_by              integer,
    updated_at               timestamp with time zone not null,
    created_ip               varchar(255)             not null,
    modified_ip              varchar(255)             not null
);

ALTER TABLE txn_member_payments
    ADD CONSTRAINT fk_txn_member_payment_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    ADD CONSTRAINT fk_txn_member_payment_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id),
    ADD CONSTRAINT fk_txn_member_payment_txn_member_member_id FOREIGN KEY (member_id) REFERENCES txn_members (member_id),
    ADD CONSTRAINT fk_txn_member_payment_mst_payment_statuses_id FOREIGN KEY (payment_status_id) REFERENCES mst_payment_statuses (payment_status_id),
    ADD CONSTRAINT fk_txn_member_payment_mst_payment_mode_id FOREIGN KEY (payment_mode_id) REFERENCES mst_payment_modes (payment_mode_id),
    ADD CONSTRAINT fk_txn_member_payment_txn_member_address_id FOREIGN KEY (address_id) REFERENCES txn_addresses (address_id),
    ADD CONSTRAINT fk_txn_member_payment_mst_program_plans_id FOREIGN KEY (program_plan_id) REFERENCES mst_program_plans (program_plan_id),
    ADD CONSTRAINT fk_txn_member_payment_mst_programs_id FOREIGN KEY (program_id) REFERENCES mst_programs (program_id);

create index ix_txn_member_payment_member_id
    on txn_member_payments (member_id);

create unique index ix_uk_txn_member_payment_invoice_id
    on txn_member_payments (invoice_id);

DROP TABLE IF EXISTS txn_member_diet_plans;
create table txn_member_diet_plans
(
    member_diet_plan_id serial primary key,
    member_id           integer                  not null,
    member_payment_id   integer                  not null,
    no_of_cycle         integer                  not null,
    days_in_cycle       integer                  not null,
    current_cycle_no    integer                  null     default null,
    current_day_no      integer                  null     default null,
    start_date          date                     null,
    end_date            date                     null,
    is_completed        boolean                  not null default false,
    active              boolean                  not null default true,
    created_by          integer,
    created_at          timestamp with time zone not null,
    modified_by         integer,
    updated_at          timestamp with time zone not null,
    created_ip          varchar(255)             not null,
    modified_ip         varchar(255)             not null
);

ALTER TABLE txn_member_diet_plans
    ADD CONSTRAINT fk_txn_member_diet_plans_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    ADD CONSTRAINT fk_txn_member_diet_plans_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id),
    ADD CONSTRAINT fk_txn_member_diet_plans_txn_member_member_id FOREIGN KEY (member_id) REFERENCES txn_members (member_id),
    ADD CONSTRAINT fk_txn_member_diet_plans_mst_payment_mode_id FOREIGN KEY (member_payment_id) REFERENCES txn_member_payments (member_payment_id);

create index ix_txn_member_diets_member_id
    on txn_member_diet_plans (member_id);

create unique index ix_uk_txn_member_diet_member_payment_id
    on txn_member_diet_plans (member_id, member_payment_id);

DROP TABLE IF EXISTS txn_member_diet_details;
create table txn_member_diet_details
(
    member_diet_detail_id serial primary key,
    member_diet_plan_id   integer                  not null,
    cycle_no              integer                  not null,
    day_no                integer                  not null,
    diet_plan             jsonb                    not null,
    start_date            date                     not null,
    end_date              date                     not null,
    type                  public.diet_type         not null,
    created_by            integer,
    created_at            timestamp with time zone not null,
    modified_by           integer,
    updated_at            timestamp with time zone not null,
    created_ip            varchar(255)             not null,
    modified_ip           varchar(255)             not null
);

create unique index ix_uk_txn_member_diet_details_dp_cy_dy
    on txn_member_diet_details (member_diet_plan_id, cycle_no, day_no);

DROP TABLE IF EXISTS txn_diet_templates;
create table txn_diet_templates
(
    diet_template_id serial primary key,
    diet_template    varchar(100)             not null,
    cycle_no         integer                  not null,
    day_no           integer                  not null,
    is_weekly        boolean                  not null,
    active           boolean                  not null default true,
    created_by       integer,
    created_at       timestamp with time zone not null,
    modified_by      integer,
    updated_at       timestamp with time zone not null,
    created_ip       varchar(255)             not null,
    modified_ip      varchar(255)             not null
);

ALTER TABLE txn_diet_templates
    ADD CONSTRAINT fk_txn_diet_templates_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    ADD CONSTRAINT fk_txn_diet_templates_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id);

DROP TABLE IF EXISTS txn_diet_template_diet_details;
create table txn_diet_template_diet_details
(
    diet_template_diet_detail_id serial primary key,
    diet_template_id             integer not null,
    cycle_no                     integer not null,
    day_no                       integer null,
    diet_detail                  jsonb   not null
);

create index ix_txn_diet_template_diet_details_diet_template_id
    on txn_diet_template_diet_details (diet_template_id);
