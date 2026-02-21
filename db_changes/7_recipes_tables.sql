DROP TABLE IF EXISTS mst_nutritives;
CREATE TABLE IF NOT EXISTS mst_nutritives
(
    nutritive_id SERIAL       NOT NULL PRIMARY KEY,
    nutritive    VARCHAR(100) NOT NULL,
    active       BOOLEAN      NULL     DEFAULT true,
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by   INT          NOT NULL,
    updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by  INT          NOT NULL,
    created_ip   VARCHAR(50)  NOT NULL,
    modified_ip  VARCHAR(50)  NOT NULL,
    CONSTRAINT fk_mst_nutritive_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_nutritive_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);

DROP TABLE IF EXISTS mst_recipe_categories;
CREATE TABLE IF NOT EXISTS mst_recipe_categories
(
    recipe_category_id SERIAL       NOT NULL PRIMARY KEY,
    recipe_category    VARCHAR(100) NOT NULL,
    active             BOOLEAN      NULL     DEFAULT true,
    created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by         INT          NOT NULL,
    updated_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by        INT          NOT NULL,
    created_ip         VARCHAR(50)  NOT NULL,
    modified_ip        VARCHAR(50)  NOT NULL,
    CONSTRAINT fk_mst_recipe_category_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_recipe_category_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);

DROP TABLE IF EXISTS mst_recipe_cuisines;
CREATE TABLE IF NOT EXISTS mst_recipe_cuisines
(
    recipe_cuisine_id SERIAL       NOT NULL PRIMARY KEY,
    recipe_cuisine    VARCHAR(100) NOT NULL,
    active            BOOLEAN      NULL     DEFAULT true,
    created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by        INT          NOT NULL,
    updated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by       INT          NOT NULL,
    created_ip        VARCHAR(50)  NOT NULL,
    modified_ip       VARCHAR(50)  NOT NULL,
    CONSTRAINT fk_mst_recipe_cuisine_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_recipe_cuisine_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);

DROP TABLE IF EXISTS mst_recipe_types;
CREATE TABLE IF NOT EXISTS mst_recipe_types
(
    recipe_type_id SERIAL       NOT NULL PRIMARY KEY,
    recipe_type    VARCHAR(100) NOT NULL,
    active         BOOLEAN      NULL     DEFAULT true,
    created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by     INT          NOT NULL,
    updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by    INT          NOT NULL,
    created_ip     VARCHAR(50)  NOT NULL,
    modified_ip    VARCHAR(50)  NOT NULL,
    CONSTRAINT fk_mst_recipe_type_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_recipe_type_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);

DROP TABLE IF EXISTS mst_recipes;
CREATE TABLE IF NOT EXISTS mst_recipes
(
    recipe_id          SERIAL       NOT NULL PRIMARY KEY,
    name               varchar(255) NOT NULL,
    details            text,
    preparation_method text,
    ingredient         text,
    how_to_make        text,
    benefits           text,
    image_path         jsonb        NOT NULL,
    visited_count      integer      NOT NULL DEFAULT 0,
    is_visible_to_all  BOOLEAN      NOT NULL DEFAULT FALSE,
    serving_count      INT                   DEFAULT '1',
    share_count        INT                   DEFAULT '0',
    tags               text,
    download_path      VARCHAR(100),
    recipe_type_id     integer      not null,
    url                varchar(250) not null,
    active             BOOLEAN      NULL     DEFAULT true,
    created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by         INT          NOT NULL,
    updated_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by        INT          NOT NULL,
    created_ip         VARCHAR(50)  NOT NULL,
    modified_ip        VARCHAR(50)  NOT NULL,
    CONSTRAINT fk_mst_recipe_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_recipe_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);

DROP TABLE IF EXISTS mst_recipe_cuisine_mappings;
CREATE TABLE IF NOT EXISTS mst_recipe_cuisine_mappings
(
    recipe_cuisine_mapping_id SERIAL      NOT NULL PRIMARY KEY,
    recipe_id                 INT         NOT NULL,
    recipe_cuisine_id         INT         NOT NULL,
    active                    BOOLEAN     NULL     DEFAULT true,
    created_at                TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by                INT         NOT NULL,
    updated_at                TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by               INT         NOT NULL,
    created_ip                VARCHAR(50) NOT NULL,
    modified_ip               VARCHAR(50) NOT NULL,
    CONSTRAINT fk_mst_recipe_cuisine_mapping_mst_recipe_cuisine_cuisine_id FOREIGN KEY (recipe_cuisine_id) REFERENCES mst_recipe_cuisines (recipe_cuisine_id),
    CONSTRAINT fk_mst_recipe_cuisine_mapping_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_recipe_cuisine_mapping_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);

DROP TABLE IF EXISTS mst_recipe_category_mappings;
CREATE TABLE IF NOT EXISTS mst_recipe_category_mappings
(
    recipe_category_mapping_id SERIAL      NOT NULL PRIMARY KEY,
    recipe_id                  INT         NOT NULL,
    recipe_category_id         INT         NOT NULL,
    active                     BOOLEAN     NULL     DEFAULT true,
    created_at                 TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by                 INT         NOT NULL,
    updated_at                 TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by                INT         NOT NULL,
    created_ip                 VARCHAR(50) NOT NULL,
    modified_ip                VARCHAR(50) NOT NULL,
    CONSTRAINT fk_mst_recipe_cuisine_mapping_mst_recipe_category_category_id FOREIGN KEY (recipe_category_id) REFERENCES mst_recipe_categories (recipe_category_id),
    CONSTRAINT fk_mst_recipe_cuisine_mapping_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_recipe_cuisine_mapping_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);

DROP TABLE IF EXISTS mst_recipe_nutritive;
CREATE TABLE IF NOT EXISTS mst_recipe_nutritive
(
    recipe_nutritive_id SERIAL           NOT NULL PRIMARY KEY,
    recipe_id           INT              NOT NULL,
    nutritive_id        INT              NOT NULL,
    value               DOUBLE PRECISION NOT NULL,
    active              BOOLEAN          NULL     DEFAULT true,
    created_at          TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by          INT              NOT NULL,
    updated_at          TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by         INT              NOT NULL,
    created_ip          VARCHAR(50)      NOT NULL,
    modified_ip         VARCHAR(50)      NOT NULL,
    CONSTRAINT fk_mst_recipe_nutritive_mst_recipe_recipe_id FOREIGN KEY (recipe_id) REFERENCES mst_recipes (recipe_id),
    CONSTRAINT fk_mst_recipe_nutritive_mst_nutritive_nutritive_id FOREIGN KEY (nutritive_id) REFERENCES mst_nutritives (nutritive_id),
    CONSTRAINT fk_mst_recipe_nutritive_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_recipe_nutritive_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);
