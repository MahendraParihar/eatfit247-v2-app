-- ============================================================================
-- 136: Pocket guide PDFs move to private storage
-- Spec: specs/features/2026-10-04-pocket-guide-download (plan group 2.1)
-- Run AFTER scripts/pocket-guide-move-private.ts has moved the files
-- (see validation.md § Rollout). Safe to re-run.
--
-- 1. Back up mst_pocket_guides.file_path (first run only) for rollback
-- 2. Rewrite public PDF references to private references:
--      media-files/pocket-guide/DetoxDiet.pdf  →  private://pocket-guide/DetoxDiet.pdf
--    The name comes from the webUrl (the file on disk), not from fileName, which can differ.
--    Same rule as PrivateStorageUtil.isPrivateUpload: an element stays public only when
--    both its mimetype and its extension are image types.
-- 3. Franchise Admin + Nutritionist → PocketGuide → read/create/update/delete
-- 4. member_pocket_guide_assigned email template (if missing)
-- ============================================================================

BEGIN;

-- 1. Backup (keyed by guide, so a re-run never overwrites the original values)
CREATE TABLE IF NOT EXISTS bkp_136_mst_pocket_guides_file_path (
    pocket_guide_id INTEGER PRIMARY KEY,
    file_path       JSONB,
    backed_up_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO bkp_136_mst_pocket_guides_file_path (pocket_guide_id, file_path)
SELECT pocket_guide_id, file_path
FROM mst_pocket_guides
WHERE file_path IS NOT NULL
ON CONFLICT (pocket_guide_id) DO NOTHING;

-- 2. Rewrite public document references
WITH rewritten AS (
    SELECT pg.pocket_guide_id,
           jsonb_agg(
               CASE
                   WHEN e.item->>'webUrl' ~ '^/?media-files/pocket-guide/[^/]+$'
                    AND NOT (
                        coalesce(e.item->>'mimetype', '') ILIKE 'image/%'
                        AND e.item->>'webUrl' ~* '\.(png|jpe?g|gif|webp|svg)$'
                    )
                   THEN jsonb_set(
                       e.item,
                       '{webUrl}',
                       to_jsonb('private://pocket-guide/' ||
                                regexp_replace(e.item->>'webUrl', '^/?media-files/pocket-guide/', ''))
                   )
                   ELSE e.item
               END
               ORDER BY e.ord
           ) AS file_path
    FROM mst_pocket_guides pg
    CROSS JOIN LATERAL jsonb_array_elements(pg.file_path) WITH ORDINALITY AS e(item, ord)
    WHERE jsonb_typeof(pg.file_path) = 'array'
    GROUP BY pg.pocket_guide_id
)
UPDATE mst_pocket_guides pg
SET file_path  = r.file_path,
    updated_at = CURRENT_TIMESTAMP
FROM rewritten r
WHERE pg.pocket_guide_id = r.pocket_guide_id
  AND pg.file_path IS DISTINCT FROM r.file_path;

-- Report anything still pointing at a public location (should be none)
DO $$
DECLARE
    leftover RECORD;
BEGIN
    FOR leftover IN
        SELECT pg.pocket_guide_id, e.item->>'webUrl' AS web_url
        FROM mst_pocket_guides pg
        CROSS JOIN LATERAL jsonb_array_elements(pg.file_path) AS e(item)
        WHERE jsonb_typeof(pg.file_path) = 'array'
          AND e.item->>'webUrl' NOT LIKE 'private://%'
    LOOP
        RAISE NOTICE 'pocket_guide_id % still has a public file reference: %', leftover.pocket_guide_id, leftover.web_url;
    END LOOP;
END $$;

-- 3. Permissions (existing rows, including deliberately deactivated ones, are left alone)
INSERT INTO mst_admin_role_subject_permissions
    (role_id, subject_id, action_id, created_by, modified_by, created_ip, modified_ip)
SELECT
    r.role_id,
    s.subject_id,
    a.action_id,
    1, 1, '0.0.0.0', '0.0.0.0'
FROM mst_admin_roles r
CROSS JOIN mst_admin_subjects s
CROSS JOIN mst_admin_actions a
WHERE r.role_code IN ('franchise_admin', 'nutritionist')
  AND s.subject_code = 'PocketGuide'
  AND a.action_code IN ('read', 'create', 'update', 'delete')
ON CONFLICT (role_id, subject_id, action_id) DO NOTHING;

-- 4. Assignment email (EJS file: templates/member/pocket-guide-assigned.ejs, plan group 4.4).
--    Staff share guides on WhatsApp manually, so no WhatsApp notification.
INSERT INTO mst_email_templates
    (template_name, subject, email_template_file, whatspp_template_file,
     send_email_notification, send_whatsapp_notification, active, created_by, modified_by)
SELECT 'member_pocket_guide_assigned',
       'Your Pocket Guides — {{franchiseName}}',
       'member/pocket-guide-assigned',
       NULL,
       true, false, true, 1, 1
WHERE NOT EXISTS (
    SELECT 1 FROM mst_email_templates WHERE template_name = 'member_pocket_guide_assigned'
);

COMMIT;

-- ============================================================================
-- Rollback (manual). Move the files back first (pocket-guide-move-private.ts does
-- not undo itself), then:
--
-- UPDATE mst_pocket_guides pg
-- SET file_path = b.file_path, updated_at = CURRENT_TIMESTAMP
-- FROM bkp_136_mst_pocket_guides_file_path b
-- WHERE pg.pocket_guide_id = b.pocket_guide_id;
--
-- Permissions and the email template can stay; they are harmless without the feature.
-- ============================================================================
