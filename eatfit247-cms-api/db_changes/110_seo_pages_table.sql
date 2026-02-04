DROP TABLE IF EXISTS mst_seo_pages;
CREATE TABLE IF NOT EXISTS mst_seo_pages
(
    seo_page_id      SERIAL       NOT NULL PRIMARY KEY,
    url               TEXT         NOT NULL UNIQUE,
    meta_title        VARCHAR(200) NULL,
    meta_description  VARCHAR(500) NULL,
    canonical_url     TEXT         NULL,
    og_type           VARCHAR(50)  NULL,
    og_title          VARCHAR(200) NULL,
    og_description    VARCHAR(500) NULL,
    og_url            TEXT         NULL,
    twitter_card      VARCHAR(50)  NULL,
    active            BOOLEAN      NOT NULL DEFAULT true,
    created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by        INT          NOT NULL,
    updated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by       INT          NOT NULL,
    created_ip        VARCHAR(21)  NOT NULL,
    modified_ip       VARCHAR(21)  NOT NULL,
    CONSTRAINT fk_mst_seo_pages_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_seo_pages_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);

CREATE INDEX ix_mst_seo_pages_url
    ON mst_seo_pages (url);

CREATE INDEX ix_mst_seo_pages_active
    ON mst_seo_pages (active);

