
DROP TABLE IF EXISTS mst_issue_statuses;
CREATE TABLE IF NOT EXISTS mst_issue_statuses
(
    issue_status_id SERIAL      NOT NULL PRIMARY KEY,
    issue_status    VARCHAR(50) NOT NULL,
    active          BOOLEAN     NULL     DEFAULT '1',
    created_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by      INT         NOT NULL,
    updated_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by     INT         NOT NULL,
    CONSTRAINT fk_mst_issue_statuses_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_issue_statuses_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);

DROP TABLE IF EXISTS mst_issue_categories;
CREATE TABLE IF NOT EXISTS mst_issue_categories
(
    issue_category_id SERIAL      NOT NULL PRIMARY KEY,
    issue_category    VARCHAR(50) NOT NULL,
    active          BOOLEAN     NULL     DEFAULT '1',
    created_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by      INT         NOT NULL,
    updated_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by     INT         NOT NULL,
    CONSTRAINT fk_mst_issue_categories_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_issue_categories_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);

DROP TABLE IF EXISTS txn_member_issues CASCADE;
CREATE TABLE IF NOT EXISTS txn_member_issues
(
    member_issue_id SERIAL      NOT NULL PRIMARY KEY,
    member_id INT NOT NULL, 
    issue    VARCHAR(1000) NOT NULL,
    issue_status_id          INT    NOT NULL   ,
    issue_category_id          INT    NOT NULL   ,
    created_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by      INT         NOT NULL,
    updated_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by     INT         NOT NULL,
    CONSTRAINT fk_txn_member_issues_txn_member_issue_id FOREIGN KEY (member_issue_id) REFERENCES txn_member_issues (member_issue_id),
    CONSTRAINT fk_txn_member_issues_mst_issue_statuses_id FOREIGN KEY (issue_status_id) REFERENCES mst_issue_statuses (issue_status_id),
    CONSTRAINT fk_txn_member_issues_mst_issue_categories_id FOREIGN KEY (issue_category_id) REFERENCES mst_issue_categories (issue_category_id),
    CONSTRAINT fk_txn_member_issues_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_txn_member_issues_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);


DROP TABLE IF EXISTS txn_member_issue_responses CASCADE;
CREATE TABLE IF NOT EXISTS txn_member_issue_responses
(
    member_issue_response_id SERIAL      NOT NULL PRIMARY KEY,
    member_issue_id INT NOT NULL, 
    response        VARCHAR(1000) NOT NULL,
    is_latest     BOOLEAN NOT NULL DEFAULT '1',
    created_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by      INT         NOT NULL,
    updated_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by     INT         NOT NULL,
    CONSTRAINT fk_txn_member_issue_responses_txn_member_issues_id FOREIGN KEY (member_issue_id) REFERENCES txn_member_issues (member_issue_id),
    CONSTRAINT fk_txn_member_issue_responses_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_txn_member_issue_responses_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);




