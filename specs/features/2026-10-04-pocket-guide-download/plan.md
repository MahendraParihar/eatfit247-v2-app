# Plan: Pocket Guide Download

> Source: [requirements.md](./requirements.md) · Done when: [validation.md](./validation.md) passes
>
> Groups 1 and 2 (storage + migration) are security- and data-sensitive. Implement and commit them **one group at a time**.

## Group 1: Private Storage (server_1 + infra)

- [x] 1.1 Add a private storage root to config (env var + default), separate from `Env.staticAssetPath` / the `ServeStaticModule` root
- [x] 1.2 File upload: when `mediaFor = pocket-guide` and the file is a PDF/document, write it to private storage and store a non-public reference in `file_path`. Images keep the current public path.
- [x] 1.3 Infra: mount the private folder on the persistent volume in `docker-compose.yml`; add it to `infra/backup-media.sh` and `init-media-dirs.sh`
- [x] 1.4 Confirm that no Nginx or serve-static path exposes the private folder

Notes (as built):
- `Env.privateAssetPath` reads `PRIVATE_ASSET_PATH`, which defaults to `<ASSET_PATH>/../private-files`. Boot fails if the two roots overlap.
- `PrivateStorageUtil` (core) handles the private side. It stores a private file's `webUrl` as `private://<mediaFor>/<fileName>`, e.g. `private://pocket-guide/DetoxDiet.pdf`. `resolvePath()` maps that reference to an absolute path and rejects any path that escapes the root. Groups 2 and 4 use the same format.
- Fail-closed rule: in `pocket-guide`, a file stays public only when both its mimetype and its extension are image types.
- The folder is bind-mounted into **admin-api only**; public-api never reads it. Host path: `PRIVATE_FILES_PATH`, default `../private-files`, which is gitignored.
- 1.4 check: every Nginx `/media-files` location proxies to admin-api, whose `ServeStaticModule` serves `ASSET_PATH` only. No Nginx `root`/`alias` points at media, and no Nginx container mounts the private folder. Against local admin-api, a probe file in `private-files/pocket-guide/` returned 404 on direct, `../`, `%2e%2e` and `..%2f` paths.

## Group 2: Data Migration (db_changes + ops)

- [x] 2.1 `db_changes/136_pocket_guide_private_files.sql`: back up the current `file_path` values (for rollback); rewrite `mst_pocket_guides.file_path` to the private reference; seed `franchise_admin` and `nutritionist` → `PocketGuide` → all 4 actions (skip rows that already exist); insert the `MEMBER_POCKET_GUIDE_ASSIGNED` template if it's missing
- [x] 2.2 Ops script (TypeScript under `scripts/`) that moves the existing `<static>/pocket-guide/*.pdf` files to private storage. Idempotent, with a dry-run mode, and it reports any row whose file is missing.
- [x] 2.3 Write the release runbook in `validation.md § Rollout` (order: deploy code → move files → apply migration → flush the RBAC cache)

Notes (as built):
- Backup table: `bkp_136_mst_pocket_guides_file_path`, keyed by guide. The first run's values win.
- The private name comes from the `webUrl` basename, not from `fileName`, because they can differ. For example, guide 6 has webUrl `RestaurantGuide-NonVeg.pdf` but fileName `RestaurantGuideNonVeg.pdf`.
- **Template name:** the row is seeded as `member_pocket_guide_assigned` (lowercase, like every other row), with file `member/pocket-guide-assigned`. Today `MemberPocketGuideService` calls `sendEmailByType` with the uppercase enum value, which never matches. It is the only caller of that method. Group 4.4 fixes that, see below.
- Script: `scripts/pocket-guide-move-private.ts`. Dry run by default, `--apply` to act. It moves every document in the public folder, referenced or not. It renames on case-only mismatches, because Linux is case-sensitive. It falls back to copy + unlink across Docker mounts (EXDEV), never overwrites, and exits with code 2 on missing files or conflicts.

## Group 3: Shared Library

- [x] 3.1 Update `IPocketGuide` / `IMemberPocketGuide`: add the file-present flag and display filename; the PDF is no longer exposed as a public `webUrl`
- [x] 3.2 `npm run build`

Notes (as built):
- Both interfaces gain `hasFile: boolean` (required) and `downloadFileName?: string`.
- `IBasePocketGuide.filePath` **stays**. The edit form sends it back on save, and `PocketGuideService.update` clears the file when it's empty, so dropping it would wipe the PDF on every edit. Since group 2 it only holds the `private://` reference, which is not a URL (JSDoc added).
- Because `hasFile` is required, `PocketGuideService.convertToModel` now sets it, which keeps server_1 compiling. `MemberPocketGuideService` still has to (4.2).

## Group 4: Backend Download + Email (server_1)

- [x] 4.1 `PocketGuideService.getFileStream(id, user)` and `GET pocket-guide/:id/download` with `@RequireAbility(Read, PocketGuide)`. Inactive guides are downloadable too. Fill `downloadFileName` in list/detail, using the same helper as the `Content-Disposition` filename (title + extension, e.g. `Khichdi Diet R.pdf`, not `1694279594335-390517095.pdf`).
- [x] 4.2 `MemberPocketGuideService`: return `hasFile` + `downloadFileName` in `getList`; add `getFileStream(memberId, pocketGuideId, user)` that checks the guide is assigned and the member is in the caller's franchises
- [x] 4.3 `GET member/:id/pocket-guide/:pocketGuideId/download` with `@RequireAbility(Read, MemberPocketGuide)`
- [x] 4.4 Assignment email: attach the newly assigned PDFs from private storage; if a file is missing, log it and still send. Switch from `sendEmailByType(MEMBER_POCKET_GUIDE_ASSIGNED)` to `getNotificationTemplate('member_pocket_guide_assigned')` + `sendEmailFromTemplate` (as `notification.listener.ts` does), and add `templates/member/pocket-guide-assigned.ejs`, which doesn't exist yet. Without that file the email is skipped.
- [x] 4.5 Jest tests for both services: file flag mapping, assignment check, franchise check, missing file, email attachments

Notes (as built):
- `PocketGuideFileUtil` (pocket-guide module, exported) is the shared helper:
  - `hasFile` (true only for a `private://` reference) and `downloadFileName`;
  - `locate()`, which never throws: a bad or escaping reference counts as missing;
  - the RFC 6266 `Content-Disposition` header and `send()`. Downloads use `@Res()` because `TransformInterceptor` would wrap a `StreamableFile`.
- 404 messages: `Pocket guide not found` / `Member not found` / `Pocket guide is not assigned to this member` / `This pocket guide has no file` / `Pocket guide file is missing on the server`. A member outside the caller's franchises gets the same 404 as an unknown member, as in `AppointmentService`; empty `franchiseIds` means unscoped. Missing files are logged as errors.
- The member route lives in `MemberContentController`, the registered controller. `MemberPocketGuideController` is not registered in `MemberModule` (dead code), so it was left alone.
- `getList(required=true)`, the member tab, now includes **inactive** assigned guides so they stay downloadable. The picker (`required=false`) still shows active guides only, so saving from the picker drops inactive assignments. That was already the behaviour.
- **Email:** `sendAssignmentEmail()` uses `getNotificationTemplate('member_pocket_guide_assigned')` + `sendEmailFromTemplate`. It replaces `{{franchiseName}}` in the subject, passes `franchise: { franchiseName }`, which every EJS layout needs, and stays fire-and-forget from `manage()`.
- **Attachment size (owner to confirm):** the default is a cap, `POCKET_GUIDE_EMAIL_ATTACHMENT_LIMIT_BYTES` = 15 MB total, filled in assignment order. Guides that don't fit, or whose file is missing, are listed as "Shared separately" with an info alert, and logged.
- New template `templates/member/pocket-guide-assigned.ejs`, with a sample in `render-previews.js`.
- **Tests:** `jest.config.ts` + `tsconfig.spec.json` added for `pocket-guide` and `member`, using the shared `jest.env-setup.ts` (dummy env, temp private folder). ts-jest runs transpile-only (`isolatedModules`) because its type-check trips on an `@types/node` 18 / TS 5.9 mismatch in `file-upload.controller.ts`; the specs are type-checked with `tsc -p tsconfig.spec.json` instead. 19 + 16 tests pass.
  - `razorpay-webhook.controller.spec.ts` was already stale before these configs existed (it calls `handleWebhook` with 3 of its 4 arguments). It is ignored in member's jest config until it's fixed.


## Group 5: Admin CMS (eatfit247-admin)

- [x] 5.1 API services: download methods returning a blob, plus a small shared save-file helper (reuse it if one already exists in `@shared`)
- [x] 5.2 Pocket Guide list: replace the "View" stub with a **Download** action (shown when the guide has a file); remove the URL / Views / Shares / Visible columns
- [x] 5.3 Member → Pocket Guide tab: add a **Download** action per assigned guide; rename the header button to "Assign Pocket Guide"
- [x] 5.4 Snackbar errors for 403 / 404 / missing file. Material components and tokens only.

Notes (as built):
- `HttpService.getBlob()` parses the JSON error body out of the Blob, so the snackbar shows the server message.
- `@shared` utils gained `saveBlobAsFile()` and `downloadErrorMessage()`: 403 → no access, 404 → the server message (e.g. "Pocket guide file is missing on the server"), anything else → retry.
- Download shows only when `hasFile` is true, in both the list and the member tab. The member tab's empty-state button also reads "Assign Pocket Guide".
- Verified against local admin-api with dev-signed tokens: Super Admin and Nutritionist get the real PDF with a friendly filename; unassigned and missing files return 404 with clear messages. Admin `ng build` passes. ESLint shows only existing `@nx/enforce-module-boundaries` circular-dependency errors on existing `@eatfit247-shared-lib`/`@env` imports.
- Known, already the case: the edit form's upload field renders existing files with `<img [src]=webUrl>`, so a PDF shows a broken thumbnail (now with a `private://` src).

## Group 6: Close-out

- [ ] 6.1 Every check in `validation.md` passes
- [ ] 6.2 `requirements.md` status → Shipped; roadmap item 4.2 → ✅ with a link to this folder
- [ ] 6.3 Replanning note: update the BRD's "personalized with member names" wording; add "private storage" to `tech-stack.md § Runtime and Infrastructure`
