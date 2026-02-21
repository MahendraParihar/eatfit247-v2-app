

INSERT INTO mst_field_types (field_type_id, field_type)
values (1, 'number'),
       (2, 'text'),
       (3, 'date'),
       (4, 'radio');

ALTER TABLE mst_configs
    ADD field_type_id INT;

ALTER TABLE mst_configs
    ADD CONSTRAINT fk_mst_config_mst_field_types_id FOREIGN KEY (field_type_id) REFERENCES mst_field_types (field_type_id);

UPDATE mst_configs
SET field_type_id = 4
WHERE config_id < 7;

update mst_configs
SET field_type_id = 1
WHERE config_name = 'TAX_PERCENTAGE';

update mst_configs
SET field_type_id = 2
WHERE config_name = 'DEFAULT_CURRENCY';



DROP TABLE IF EXISTS mst_user_statuses;
CREATE TABLE IF NOT EXISTS mst_user_statuses
(
    user_status_id SERIAL      NOT NULL PRIMARY KEY,
    user_status    VARCHAR(50) NOT NULL,
    active         BOOLEAN     NULL     DEFAULT '1',
    created_at     TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by     INT         NOT NULL,
    updated_at     TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by    INT         NOT NULL
);

ALTER TABLE txn_members
    ADD CONSTRAINT fk_txn_members_mst_user_statuses_id FOREIGN KEY (user_status_id) REFERENCES mst_user_statuses (user_status_id);

ALTER TABLE mst_blog_categories
    add column image_path jsonb NULL DEFAULT NULL;
ALTER TABLE mst_blood_sugars
    add column image_path jsonb NULL DEFAULT NULL;
ALTER TABLE mst_call_purposes
    add column image_path jsonb NULL DEFAULT NULL;
ALTER TABLE mst_call_types
    add column image_path jsonb NULL DEFAULT NULL;
ALTER TABLE mst_eating_habits
    add column image_path jsonb NULL DEFAULT NULL;
ALTER TABLE mst_genders
    add column image_path jsonb NULL DEFAULT NULL;
ALTER TABLE mst_health_issues
    add column image_path jsonb NULL DEFAULT NULL;
ALTER TABLE mst_lifestyles
    add column image_path jsonb NULL DEFAULT NULL;
ALTER TABLE mst_marital_statuses
    add column image_path jsonb NULL DEFAULT NULL;
ALTER TABLE mst_nutritives
    add column image_path jsonb NULL DEFAULT NULL;
ALTER TABLE mst_pocket_guides
    add column image_path jsonb NULL DEFAULT NULL;
ALTER TABLE mst_recipe_categories
    add column image_path jsonb NULL DEFAULT NULL;
ALTER TABLE mst_recipe_cuisines
    add column image_path jsonb NULL DEFAULT NULL;
ALTER TABLE mst_religions
    add column image_path jsonb NULL DEFAULT NULL;
ALTER TABLE mst_sleeping_patterns
    add column image_path jsonb NULL DEFAULT NULL;
ALTER TABLE mst_type_of_exercises
    add column image_path jsonb NULL DEFAULT NULL;
ALTER TABLE mst_urine_outputs
    add column image_path jsonb NULL DEFAULT NULL;
ALTER TABLE mst_recipe_types
    add column image_path jsonb NULL DEFAULT NULL;
alter table mst_recipe_categories
    add column from_time varchar(50) not null,
    add column to_time   varchar(50) not null,
    add column sequence  integer     not null;
