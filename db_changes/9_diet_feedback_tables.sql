DROP TABLE IF EXISTS mst_feedback_option_types;
CREATE TABLE IF NOT EXISTS mst_feedback_option_types
(
    feedback_option_type_id SERIAL       NOT NULL PRIMARY KEY,
    feedback_option_type    VARCHAR(100) NOT NULL,
    active                  BOOLEAN      NULL     DEFAULT true,
    created_at              TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by              INT          NOT NULL,
    updated_at              TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by             INT          NOT NULL,
    created_ip              VARCHAR(50)  NOT NULL,
    modified_ip             VARCHAR(50)  NOT NULL,
    CONSTRAINT fk_mst_feedback_option_type_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_feedback_option_type_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id)
);

DROP TABLE IF EXISTS mst_feedback_questions;
CREATE TABLE IF NOT EXISTS mst_feedback_questions
(
    feedback_question_id    SERIAL       NOT NULL PRIMARY KEY,
    feedback_question       VARCHAR(500) NOT NULL,
    feedback_option_type_id INT          NOT NULL,
    active                  BOOLEAN      NULL     DEFAULT true,
    created_at              TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by              INT          NOT NULL,
    updated_at              TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by             INT          NOT NULL,
    created_ip              VARCHAR(50)  NOT NULL,
    modified_ip             VARCHAR(50)  NOT NULL,
    CONSTRAINT fk_mst_feedback_question_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_feedback_question_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_feedback_question_mst_feedback_option_type_type_id FOREIGN KEY (feedback_option_type_id) REFERENCES mst_feedback_option_types (feedback_option_type_id)
);


DROP TABLE IF EXISTS mst_feedback_question_options;
CREATE TABLE IF NOT EXISTS mst_feedback_question_options
(
    feedback_question_option_id SERIAL      NOT NULL PRIMARY KEY,
    feedback_question_option    VARCHAR(50) NOT NULL,
    feedback_question_id        INT         NOT NULL,
    active                      BOOLEAN     NULL     DEFAULT true,
    created_at                  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by                  INT         NOT NULL,
    updated_at                  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by                 INT         NOT NULL,
    created_ip                  VARCHAR(50) NOT NULL,
    modified_ip                 VARCHAR(50) NOT NULL,
    CONSTRAINT fk_mst_feedback_question_option_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_feedback_question_option_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_mst_feedback_question_option_mst_feedback_question_qst_id FOREIGN KEY (feedback_question_id) REFERENCES mst_feedback_questions (feedback_question_id)
);
