-- ============================================================================
-- 122: Google Reviews table (polymorphic: PRODUCT / PROGRAM_PLAN)
-- Source: GOOGLE (synced) or MANUAL (admin-entered). Schema is sync-ready;
-- a future job can upsert rows by (source='GOOGLE', google_review_id_ext).
-- ============================================================================

DROP TABLE IF EXISTS txn_google_review;
CREATE TABLE IF NOT EXISTS txn_google_review
(
    google_review_id        BIGSERIAL    NOT NULL PRIMARY KEY,
    entity_type             VARCHAR(30)  NOT NULL,            -- 'PRODUCT' | 'PROGRAM_PLAN'
    entity_id               BIGINT       NOT NULL,            -- logical FK to product_id / plan_id
    source                  VARCHAR(20)  NOT NULL DEFAULT 'MANUAL', -- 'GOOGLE' | 'MANUAL'
    google_review_id_ext    VARCHAR(120) NULL     DEFAULT NULL,    -- Google's review id (for sync upserts)
    reviewer_name           VARCHAR(150) NOT NULL,
    reviewer_photo_url      VARCHAR(500) NULL     DEFAULT NULL,
    rating                  SMALLINT     NOT NULL,
    review_text             TEXT         NULL     DEFAULT NULL,
    review_date             TIMESTAMP    NOT NULL,
    language                VARCHAR(10)  NOT NULL DEFAULT 'en',
    admin_reply             TEXT         NULL     DEFAULT NULL,
    admin_replied_at        TIMESTAMP    NULL     DEFAULT NULL,
    admin_replied_by        INT          NULL     DEFAULT NULL,
    helpful_count           INT          NOT NULL DEFAULT 0,
    is_published            BOOLEAN      NOT NULL DEFAULT true,
    display_order           INT          NOT NULL DEFAULT 0,
    active                  BOOLEAN      NULL     DEFAULT true,
    created_at              TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by              INT          NOT NULL,
    updated_at              TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by             INT          NOT NULL,
    created_ip              VARCHAR(50)  NOT NULL,
    modified_ip             VARCHAR(50)  NOT NULL,
    CONSTRAINT ck_txn_google_review_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT ck_txn_google_review_entity_type CHECK (entity_type IN ('PRODUCT', 'PROGRAM_PLAN')),
    CONSTRAINT ck_txn_google_review_source CHECK (source IN ('GOOGLE', 'MANUAL')),
    CONSTRAINT fk_txn_google_review_mst_admin_created_by FOREIGN KEY (created_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_txn_google_review_mst_admin_modified_by FOREIGN KEY (modified_by) REFERENCES mst_admin_users (admin_id),
    CONSTRAINT fk_txn_google_review_mst_admin_replied_by FOREIGN KEY (admin_replied_by) REFERENCES mst_admin_users (admin_id)
);

CREATE INDEX ix_txn_google_review_entity
    ON txn_google_review (entity_type, entity_id, is_published, active);

CREATE INDEX ix_txn_google_review_rating
    ON txn_google_review (rating);

CREATE UNIQUE INDEX ux_txn_google_review_google_ext
    ON txn_google_review (google_review_id_ext)
    WHERE google_review_id_ext IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Register CASL subject so RBAC can grant access to the new screen.
-- AFTER INSERT trigger on mst_admin_subjects grants all 4 actions to
-- Super Admin (grant_all_on_new_subject = true).
-- ---------------------------------------------------------------------------
INSERT INTO mst_admin_subjects (subject_code, subject_name, franchise_scoped)
VALUES ('GoogleReview', 'Google Reviews', false)
ON CONFLICT (subject_code) DO NOTHING;
