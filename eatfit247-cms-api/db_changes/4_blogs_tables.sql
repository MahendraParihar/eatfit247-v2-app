DROP TABLE IF EXISTS mst_blog_authors;
CREATE TABLE IF NOT EXISTS mst_blog_authors
(
    blog_author_id  SERIAL       NOT NULL PRIMARY KEY,
    first_name      VARCHAR(50)  NOT NULL,
    last_name       VARCHAR(50)  NOT NULL,
    profile_picture jsonb        NULL,
    country_code    VARCHAR(5)   NOT NULL,
    contact_number  VARCHAR(12)  NOT NULL,
    email_id        VARCHAR(100) NOT NULL,
    linked_url      VARCHAR(250) NULL     DEFAULT NULL,
    active          BOOLEAN      NULL     DEFAULT true,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by      INT          NOT NULL,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by     INT          NOT NULL,
    created_ip      VARCHAR(50)  NOT NULL,
    modified_ip     VARCHAR(50)  NOT NULL,
    CONSTRAINT fk_mst_blog_author_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_blog_author_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);

DROP TABLE IF EXISTS mst_blog_categories;
CREATE TABLE IF NOT EXISTS mst_blog_categories
(
    blog_category_id SERIAL       NOT NULL PRIMARY KEY,
    blog_category    VARCHAR(100) NOT NULL,
    url              VARCHAR(250) NOT NULL,
    active           BOOLEAN      NULL     DEFAULT true,
    created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by       INT          NOT NULL,
    updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by      INT          NOT NULL,
    created_ip       VARCHAR(50)  NOT NULL,
    modified_ip      VARCHAR(50)  NOT NULL,
    CONSTRAINT fk_mst_blog_category_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_blog_category_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);

DROP TABLE IF EXISTS txn_blogs;
CREATE TABLE IF NOT EXISTS txn_blogs
(
    blog_id                    SERIAL       NOT NULL PRIMARY KEY,
    blog_category_id           INT          NOT NULL,
    blog_author_id             INT          NOT NULL,
    title                      VARCHAR(100) NOT NULL,
    description                TEXT         NOT NULL,
    image_path                 jsonb        NOT NULL,
    is_published               BOOLEAN      NOT NULL DEFAULT false,
    is_comment_allow           BOOLEAN      NOT NULL DEFAULT false,
    is_mail_sent_to_subscriber BOOLEAN      NOT NULL DEFAULT false,
    visited_count              INT          NOT NULL DEFAULT 0,
    share_count                INT          NOT NULL DEFAULT 0,
    tags                       text         NOT NULL,
    written_at                 DATE         NOT NULL,
    url                        VARCHAR(250) NOT NULL,
    active                     BOOLEAN      NULL     DEFAULT true,
    created_at                 TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by                 INT          NOT NULL,
    updated_at                 TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by                INT          NOT NULL,
    created_ip                 VARCHAR(50)  NOT NULL,
    modified_ip                VARCHAR(50)  NOT NULL,
    CONSTRAINT fk_txn_blogs_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_txn_blogs_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_txn_blogs_mst_blog_category_blog_category_id FOREIGN KEY (blog_category_id) REFERENCES mst_blog_categories (blog_category_id),
    CONSTRAINT fk_txn_blogs_mst_blog_author_blog_author_id FOREIGN KEY (blog_author_id) REFERENCES mst_blog_authors (blog_author_id)
);

CREATE INDEX ix_txn_blogs_blog_category
    ON txn_blogs (blog_category_id);

CREATE INDEX ix_txn_blogs_title
    ON txn_blogs (title);

CREATE UNIQUE INDEX ix_txn_blogs_url
    ON txn_blogs (url);

DROP TABLE IF EXISTS txn_blog_comment;
CREATE TABLE IF NOT EXISTS txn_blog_comment
(
    blog_comment_id       SERIAL        NOT NULL PRIMARY KEY,
    blog_id               INT           NOT NULL,
    comment               VARCHAR(1000) NOT NULL,
    commented_by_name     VARCHAR(100)  NOT NULL,
    commented_by_email_id VARCHAR(100)  NOT NULL,
    is_mail_sent          BOOLEAN       NULL     DEFAULT false,
    active                BOOLEAN       NULL     DEFAULT true,
    created_at            TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by           INT           NOT NULL,
    created_ip            VARCHAR(50)   NOT NULL,
    modified_ip           VARCHAR(50)   NOT NULL,
    CONSTRAINT fk_txn_blog_comment_txn_blogs_blog_id FOREIGN KEY (blog_id) REFERENCES txn_blogs (blog_id),
    CONSTRAINT fk_txn_blog_comment_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);

CREATE INDEX ix_txn_blog_comment_blog_id
    ON txn_blog_comment (blog_id);

DROP TABLE IF EXISTS txn_blog_comment_response;
CREATE TABLE IF NOT EXISTS txn_blog_comment_response
(
    blog_comment_response_id SERIAL        NOT NULL PRIMARY KEY,
    blog_id                  INT           NOT NULL,
    blog_comment_id          INT           NOT NULL,
    response                 VARCHAR(1000) NOT NULL,
    responded_by             INT           NOT NULL,
    is_mail_sent             BOOLEAN       NULL     DEFAULT false,
    active                   BOOLEAN       NULL     DEFAULT true,
    created_at               TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at               TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_ip               VARCHAR(50)   NOT NULL,
    modified_ip              VARCHAR(50)   NOT NULL,
    CONSTRAINT fk_txn_blog_comment_response_mst_admin_responded_by FOREIGN KEY (responded_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_txn_blog_comment_txn_blogs_blog_id FOREIGN KEY (blog_id) REFERENCES txn_blogs (blog_id),
    CONSTRAINT fk_txn_blog_comment_txn_blog_comment_blog_comment_id FOREIGN KEY (blog_comment_id) REFERENCES txn_blog_comment (blog_comment_id)
);

CREATE INDEX ix_txn_blog_comment_response_blog_id
    ON txn_blog_comment_response (blog_id);

CREATE INDEX ix_txn_blog_comment_response_blog_comment_id
    ON txn_blog_comment_response (blog_comment_id);
