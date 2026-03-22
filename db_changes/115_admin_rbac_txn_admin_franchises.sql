-- RBAC: many-to-many admin <-> franchise for nutritionists (and optional extra franchises).
-- Depends on: public.mst_admin_users, public.mst_franchises, public.mst_admin_roles (role_code from 113_roles_permissions.sql).
-- Safe to re-run: INSERTs use NOT EXISTS / ON CONFLICT DO NOTHING.

-- ---------------------------------------------------------------------------
-- 1) Junction: one admin may serve multiple franchises (e.g. nutritionist).
--    Franchise-scoped roles still resolve effective IDs as:
--    DISTINCT UNION(mst_admin_users.franchise_id, txn_admin_franchises.franchise_id)
--    (application layer; Super Admin ignores scope).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.txn_admin_franchises
(
    admin_franchise_id SERIAL                   NOT NULL PRIMARY KEY,
    admin_id           INT                      NOT NULL,
    franchise_id       INT                      NOT NULL,
    created_at         TIMESTAMP                NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP                NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by         INT                      NOT NULL,
    modified_by        INT                      NOT NULL,
    created_ip         VARCHAR(50)              NOT NULL,
    modified_ip        VARCHAR(50)              NOT NULL,
    CONSTRAINT fk_txn_admin_franchises_mst_admin_users_admin_id
        FOREIGN KEY (admin_id) REFERENCES public.mst_admin_users (admin_id)
            ON DELETE CASCADE,
    CONSTRAINT fk_txn_admin_franchises_mst_franchises_franchise_id
        FOREIGN KEY (franchise_id) REFERENCES public.mst_franchises (franchise_id)
            ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_txn_admin_franchises_admin_franchise
    ON public.txn_admin_franchises (admin_id, franchise_id);

CREATE INDEX IF NOT EXISTS ix_txn_admin_franchises_admin_id
    ON public.txn_admin_franchises (admin_id);

CREATE INDEX IF NOT EXISTS ix_txn_admin_franchises_franchise_id
    ON public.txn_admin_franchises (franchise_id);

-- Backfill: copy primary franchise from mst_admin_users so existing scoped users keep the same effective list.
INSERT INTO public.txn_admin_franchises (admin_id, franchise_id, created_by, modified_by, created_ip, modified_ip,
                                         created_at, updated_at)
SELECT u.admin_id,
       u.franchise_id,
       COALESCE(NULLIF(u.created_by, 0), 1),
       COALESCE(NULLIF(u.modified_by, 0), 1),
       COALESCE(NULLIF(TRIM(u.created_ip), ''), '0.0.0.0'),
       COALESCE(NULLIF(TRIM(u.modified_ip), ''), '0.0.0.0'),
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP
FROM public.mst_admin_users u
WHERE u.franchise_id IS NOT NULL
ON CONFLICT (admin_id, franchise_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2) New canonical roles (role_code aligns with shared-library AdminRoleEnum).
-- ---------------------------------------------------------------------------
INSERT INTO public.mst_admin_roles (role, role_code, created_at)
SELECT 'Account User', 'account_user', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM public.mst_admin_roles r WHERE r.role_code = 'account_user');

INSERT INTO public.mst_admin_roles (role, role_code, created_at)
SELECT 'Social Content Manager', 'social_content_manager', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM public.mst_admin_roles r WHERE r.role_code = 'social_content_manager');
