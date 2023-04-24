DROP TABLE IF EXISTS mst_faq_categories;
CREATE TABLE IF NOT EXISTS mst_faq_categories
(
    faq_category_id SERIAL       NOT NULL PRIMARY KEY,
    faq_category    VARCHAR(100) NOT NULL,
    url             VARCHAR(250) NOT NULL,
    active          BOOLEAN      NULL     DEFAULT true,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by      INT          NOT NULL,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by     INT          NOT NULL,
    created_ip      VARCHAR(50)  NOT NULL,
    modified_ip     VARCHAR(50)  NOT NULL,
    CONSTRAINT fk_mst_faq_category_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_faq_category_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);

DROP TABLE IF EXISTS txn_faqs;
CREATE TABLE IF NOT EXISTS txn_faqs
(
    faq_id          SERIAL       NOT NULL PRIMARY KEY,
    faq_category_id INT          NOT NULL,
    faq             VARCHAR(500) NOT NULL,
    answer          text         NOT NULL,
    active          BOOLEAN      NULL     DEFAULT true,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by      INT          NOT NULL,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by     INT          NOT NULL,
    created_ip      VARCHAR(50)  NOT NULL,
    modified_ip     VARCHAR(50)  NOT NULL,
    CONSTRAINT fk_txn_faqs_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_txn_faqs_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_txn_faqs_mst_faq_category_faq_category_id FOREIGN KEY (faq_category_id) REFERENCES mst_faq_categories (faq_category_id)
);
