DROP TABLE IF EXISTS mst_email_templates;
CREATE TABLE IF NOT EXISTS mst_email_templates
(
    email_template_id SERIAL      NOT NULL PRIMARY KEY,
    template_name    VARCHAR(50) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    body VARCHAR(4000) NOT NULL,
    active          BOOLEAN     NULL     DEFAULT '1',
    created_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by      INT         NOT NULL,
    updated_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by     INT         NOT NULL,
    CONSTRAINT fk_mst_email_templates_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_email_templates_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);

