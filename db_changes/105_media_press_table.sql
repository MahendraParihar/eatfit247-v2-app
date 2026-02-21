CREATE TYPE press_media_type AS ENUM (
    'youtube',
    'press'
    );

DROP TABLE IF EXISTS txn_press_media;
CREATE TABLE IF NOT EXISTS txn_press_media
(
    press_media_id SERIAL           NOT NULL PRIMARY KEY,
    title          VARCHAR(200)     NULL,
    image_path     jsonb            NOT NULL,
    type           press_media_type NOT NULL default 'press'::press_media_type,
    link           text             NOT NULL,
    active         BOOLEAN          NULL     DEFAULT true,
    created_at     TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by     INT              NOT NULL,
    updated_at     TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by    INT              NOT NULL,
    created_ip     VARCHAR(50)      NOT NULL,
    modified_ip    VARCHAR(50)      NOT NULL,
    CONSTRAINT fk_txn_press_media_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_txn_press_media_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);

CREATE INDEX ix_txn_press_media_type
    ON public.txn_press_media (type);