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

- [ ] 2.1 `db_changes/136_pocket_guide_private_files.sql`: back up the current `file_path` values (for rollback); rewrite `mst_pocket_guides.file_path` to the private reference; seed `franchise_admin` and `nutritionist` → `PocketGuide` → all 4 actions (skip rows that already exist); insert the `MEMBER_POCKET_GUIDE_ASSIGNED` template if it's missing
- [ ] 2.2 Ops script (TypeScript under `scripts/`) that moves the existing `<static>/pocket-guide/*.pdf` files to private storage. Idempotent, with a dry-run mode, and it reports any row whose file is missing.
- [ ] 2.3 Write the release runbook in `validation.md § Rollout` (order: deploy code → move files → apply migration → flush the RBAC cache)

## Group 3: Shared Library

- [ ] 3.1 Update `IPocketGuide` / `IMemberPocketGuide`: add the file-present flag and display filename; the PDF is no longer exposed as a public `webUrl`
- [ ] 3.2 `npm run build`

## Group 4: Backend Download + Email (server_1)

- [ ] 4.1 `PocketGuideService.getFileStream(id, user)` and `GET pocket-guide/:id/download` with `@RequireAbility(Read, PocketGuide)`. Inactive guides are downloadable too.
- [ ] 4.2 `MemberPocketGuideService`: return the file flag in `getList`; add `getFileStream(memberId, pocketGuideId, user)` that checks the guide is assigned and the member is in the caller's franchises
- [ ] 4.3 `GET member/:id/pocket-guide/:pocketGuideId/download` with `@RequireAbility(Read, MemberPocketGuide)`
- [ ] 4.4 Assignment email: attach the newly assigned PDFs from private storage; if a file is missing, log it and still send
- [ ] 4.5 Jest tests for both services: file flag mapping, assignment check, franchise check, missing file, email attachments

## Group 5: Admin CMS (eatfit247-admin)

- [ ] 5.1 API services: download methods returning a blob, plus a small shared save-file helper (reuse it if one already exists in `@shared`)
- [ ] 5.2 Pocket Guide list: replace the "View" stub with a **Download** action (shown when the guide has a file); remove the URL / Views / Shares / Visible columns
- [ ] 5.3 Member → Pocket Guide tab: add a **Download** action per assigned guide; rename the header button to "Assign Pocket Guide"
- [ ] 5.4 Snackbar errors for 403 / 404 / missing file. Material components and tokens only.

## Group 6: Close-out

- [ ] 6.1 Every check in `validation.md` passes
- [ ] 6.2 `requirements.md` status → Shipped; roadmap item 4.2 → ✅ with a link to this folder
- [ ] 6.3 Replanning note: update the BRD's "personalized with member names" wording; add "private storage" to `tech-stack.md § Runtime and Infrastructure`
