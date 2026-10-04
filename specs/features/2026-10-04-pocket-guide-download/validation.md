# Validation: Pocket Guide Download

## Acceptance Scorecard

Result key: ✅ verified · ◐ partly verified (the note says what is missing) · ☐ not verified yet.
Verification on 2026-10-04 used local admin-api with short-lived tokens signed by the dev JWT secret (Super Admin id 1, Nutritionist id 4 mapped to franchise 1), plus Jest. The browser extension was unavailable, so screen behaviour comes from the owner's own testing or is still open. Local data has no Franchise Admin or Social Content Manager users, no inactive guides, and no guide assignments outside franchise 1.

| # | Criterion | How verified | Result |
|---|-----------|--------------|--------|
| A1 | Given a guide with a PDF, when a Nutritionist or Franchise Admin clicks **Download** in the Pocket Guide list, then the PDF is saved with a readable filename | Browser (both roles) | ◐ API as Nutritionist: 200 `application/pdf`, `Party guide.pdf` / `Detox Diet.pdf`. Owner downloaded from the master list in the browser (2026-10-04). A Franchise Admin run is still open (no local user). |
| A2 | Given a member with assigned guides, when staff with access click **Download** on the member's Pocket Guide tab, then that guide's PDF is saved | Browser | ✅ API as Super Admin and Nutritionist: 200, 2.8 MB `%PDF-`, `Alcohol Guide.pdf`. Owner downloaded from the member tab in the browser (2026-10-04). |
| A3 | Given **no** login, when anyone requests the PDF by any URL (`/media-files/pocket-guide/*.pdf`, the old `webUrl`, direct private paths), then they get 401/403/404 and never the file | curl against local Docker + Nginx | ◐ Against local admin-api: download routes 401; `/media-files/pocket-guide/DetoxDiet.pdf`, `AlcoholGuide.pdf`, `../private-files`, `%2e%2e/private-files`, `/private-files` and `private:` all 404. Docker + Nginx were not run (config reviewed: every `/media-files` block proxies admin-api's static root only). |
| A4 | Given a member in franchise B, when a Nutritionist mapped only to franchise A calls the member download endpoint, then the response is 403/404 | curl with that nutritionist's token; Jest | ✅ Nutritionist (franchise 1) → member 5850 (franchise 2): 404 "Member not found"; Super Admin on the same member gets past the franchise check. Jest covers download, list and assign. |
| A5 | Given a guide that is **not** assigned to the member, when the member download endpoint is called for it, then the response is 404 | curl; Jest | ✅ 404 "Pocket guide is not assigned to this member" (curl + Jest) |
| A6 | Given a role without `PocketGuide` read (e.g. Social Content Manager), when it calls the master download, then the response is 403 and the menu item is hidden | curl + browser | ☐ No local user with such a role. The route uses the same `@RequireAbility(Read, PocketGuide)` as the existing list endpoint. |
| A7 | When a nutritionist assigns new guides, then the member's email has those PDFs attached (only the newly assigned ones) | Local mail catcher / test inbox | **N/A for this release.** No email service is configured in production (owner, 2026-10-04), and locally SMTP is refused (`log_errors`: `ECONNREFUSED …:587`). The code path is covered by Jest (only new guides, friendly names, 15 MB cap) and the template renders. Delivery failures are logged and never block the assignment. Re-test once SMTP is configured. |
| A8 | Given a guide whose file is missing on disk, then assignment still succeeds, the email sends without that attachment, the error is logged, and the download shows a clear error | Jest + browser | ◐ Jest: email still sent, guide listed as not attached, error logged. curl: 404 "Pocket guide file is missing on the server" (guide 34). The snackbar was not seen in a browser. |
| A9 | After a new PDF is uploaded through admin, it lands in private storage (not under the static root) and downloads correctly | Browser + `ls` on the volume | ✅ Owner uploaded `AlcoholGuide.pdf` through admin: the file is in `private-files/pocket-guide/`, the DB holds `private://pocket-guide/AlcoholGuide.pdf`, and it downloads. New uploads now get a unique name prefix (review fix). |
| A10 | The admin list has no broken columns (URL/Views/Shares/Visible are gone), and the member tab button reads "Assign Pocket Guide" | Browser | ✅ UI run E5 (list headers: Image, Title, Status, Created/Updated By/At, Actions; no View button) and E13 ("Assign Pocket Guide"). |
| A11 | Given an **inactive** guide, a Franchise Admin and a Nutritionist can download it from the master list; both roles can also create, edit and deactivate guides | Browser (both roles) | ◐ UI run: Super Admin edits and deactivates guide 22, then downloads it from the list (E12) and from the member tab (E13). Nutritionist opens the edit screen (Update shown, Edit action in the list) and downloads the inactive guide (E17). Jest covers both downloads. Franchise Admin is still open (no local user). |
| A12 | Existing production guides still download after migration `136` and the file-move script | Run on a copy of the production DB + media | ☐ Needs a production copy. |

## Edit Screen UI Run (2026-10-04)

`/pocket-guide/edit/22`, driven in headless Chromium against the local admin and admin-api. The session came from a dev-signed token; everything else was real. Guide 22 was snapshotted and restored exactly afterwards, and the test uploads were deleted. **17/17 pass** after fix `9562ea9b`:

| # | Case | Result |
|---|------|--------|
| E1 | Loads saved title, description and status | ✅ |
| E2 | Saved PDF shows a PDF icon + file name (no broken `<img>`) | ✅ |
| E3 | Saved thumbnail renders | ✅ |
| E4 | Update with no changes keeps `private://pocket-guide/AlcoholGuide.pdf` | ✅ |
| E5 | List: URL/Views/Shares/Visible columns and View button gone; Download shown | ✅ |
| E6 | List Download saves `Alcohol Guide.pdf` (2,796,044 bytes, `%PDF-`) | ✅ |
| E7 | Adding a second PDF shows the "Only one file" alert | ✅ |
| E8 | A PNG dropped on the PDF field is ignored (no upload). Note: no message is shown to the user | ✅ |
| E9 | New PDF upload goes to `private-files/` as `<timestamp>-<hex>-name.pdf`, never `media-files/` | ✅ |
| E10 | Update saves it; list Download returns the new bytes as `Alcohol Guide.pdf` | ✅ |
| E11 | Empty title blocks Update ("Pocket Guide Title is required", no request) | ✅ |
| E12 | Rename + Inactive saves; the inactive guide still downloads as `Alcohol Guide QA.pdf` | ✅ |
| E13 | Member tab lists the inactive assigned guide and downloads it; button reads "Assign Pocket Guide" | ✅ |
| E14 | Image upload stays public (`media-files/pocket-guide/…`) | ✅ |
| E15 | Cancel returns to the list without saving | ✅ |
| E16 | Removing the PDF + Update hides Download; API says "This pocket guide has no file" | ✅ after fix. It was a **500**: `file_path` is NOT NULL and the service wrote `null` (an older bug). It now writes `[]`. |
| E17 | Nutritionist: edit screen with Update, Edit action in the list, inactive guide downloads | ✅ |

## Automated Checks

- [x] `cd shared-library && npm run build`
- [x] server_1 tests: `pocket-guide` 21/21, `member` 21/21 (A4, A5, A7, A8). `core` 117/118: the one failure is already in `abilities.guard.spec.ts` (mock identity), and this feature doesn't touch it.
- [x] server_1 build: `admin-api` + `public-api` (uncached)
- [ ] server_1 lint: **not runnable**. server_1 has no ESLint config and no `lint` target.
- [x] eatfit247-admin `ng build`
- [ ] eatfit247-admin lint: 5 `@nx/enforce-module-boundaries` "circular dependency" errors, all on existing `@eatfit247-shared-lib` / `@env` import lines in the touched files. This looks project-wide and was there before; it needs its own fix.
- [x] Migration `136` on a pre-migration copy (local schema, original `file_path` values from the backup table, in a throwaway DB): 22 references rewritten, template inserted, second run a no-op, result identical to the migrated local DB. The permission seed was checked separately in a rolled-back run on the local DB (7 rows).
- [ ] Migration `136` on a production copy
- [ ] File-move script dry run on the production copy. Local run: 19 already private, 1 case fix (`Partyguide.pdf` → `PartyGuide.pdf`), 2 missing (guides 34 and 35, Khichdi).

## Manual Checks

- [x] curl: authenticated master and member downloads return `200` with `Content-Type: application/pdf` and a friendly `Content-Disposition`; unauthenticated returns `401`
- [ ] Browser: admin Pocket Guide list + member tab as Super Admin, Franchise Admin and Nutritionist. **Owner, 2026-10-04:** editing a guide works (the private `filePath` survives a save), master-list download works, member-tab download works. Not yet run per role: Franchise Admin.
- [ ] RBAC cache flushed (or users re-logged-in) after the permission seed; Franchise Admin now sees the Pocket Guide menu, and both roles see Create/Edit/Status actions

## Deferred (Phase 5 harness)

- [ ] Playwright e2e: log in as a nutritionist → assign a guide → download from the member tab
- [ ] Integration test: an unauthenticated GET to the old public path returns 404 through Nginx

## Review

- [x] Diff reviewed against `requirements.md` (decisions 1–8 honoured; deviations recorded in `plan.md` notes)
- [x] Deep review by subagent (2026-10-04) of `f3457081..HEAD`. Path traversal, static exposure and Content-Disposition came back clean, and there is no new `any`. Findings and outcomes:
  - "Unauthenticated upload can overwrite private PDFs" (high): **not reproducible** as stated. A global `JwtAuthGuard` (`CommonModule`) returns 401 on both APIs. The real issue underneath, any logged-in upload overwriting a file of the same name, is **fixed**: private uploads get a unique name.
  - List / assign endpoints had no franchise check, and assigning now emails PDFs: **fixed** (`findMemberInScope` on list, picker, assign and download).
  - Editing a member's guides hard-deleted inactive assignments: **fixed**. `manage()` keeps them and accepts an already-assigned inactive id.
  - Stream error kept the PDF headers: **fixed**.
  - Empty `franchiseIds` is treated as unscoped (the spec says grant-all only): **deferred to roadmap 4.4**. It's the codebase-wide convention (`CaslAbilityFactory`, `AppointmentService`). Changing it here alone would make this module inconsistent.
  - Low / plausible, open: symlinks inside the private root are followed; admin routes are also mounted on public-api (they need admin auth; in Docker the private folder isn't mounted there); the compose mount target uses compose variables, so it must match `PRIVATE_ASSET_PATH` in `main.env`.
- [x] Specs updated for every fix made during review

## Rollout

Order matters: the code must be live before files move (new uploads already go to private storage), and the files must move before the DB references change. Every step is safe to re-run.

1. **Deploy code** with `PRIVATE_ASSET_PATH` set in `infra/main.env`, matching the admin-api `private-files` mount in `docker-compose.yml`. Run `init-media-dirs.sh` or `mkdir -p <PRIVATE_ASSET_PATH>/pocket-guide`. Take a backup first: `infra/backup-media.sh backup`.
2. **Move the files** inside admin-api, which has both folders mounted and the DB env:
   ```bash
   docker cp scripts/pocket-guide-move-private.ts eatfit-admin-api:/home/app/server_1/
   docker exec -w /home/app/server_1 eatfit-admin-api node --experimental-strip-types pocket-guide-move-private.ts          # dry run
   docker exec -w /home/app/server_1 eatfit-admin-api node --experimental-strip-types pocket-guide-move-private.ts --apply
   ```
   Read the dry run first. `missing` rows have no file anywhere: re-upload those guides in admin after release. `conflict` rows need a manual decision. Exit code 2 means at least one of these exists. Case-only differences (the DB says `PartyGuide.pdf`, the disk has `Partyguide.pdf`) are fixed automatically by renaming the file.
3. **Apply the migration:** `psql … -v ON_ERROR_STOP=1 -f db_changes/136_pocket_guide_private_files.sql`. Any `NOTICE … still has a public file reference` line points to a row to fix by hand.
4. **Flush the RBAC cache.** In production, permissions are cached in Redis for 1 h under `rbac:permissions:<adminId>`:
   ```bash
   redis-cli -h "$REDIS_HOST" --scan --pattern 'rbac:permissions:*' | xargs -r redis-cli -h "$REDIS_HOST" del
   ```
   Outside production the cache is in memory, so restarting admin-api is enough.
5. **Smoke test** A1–A3 in production. `curl -I https://<admin-host>/media-files/pocket-guide/DetoxDiet.pdf` must return 404.

**Rollback.** The script **moves** the files, it doesn't copy them, and there is no reverse script.
1. Move the PDFs from `<PRIVATE_ASSET_PATH>/pocket-guide/` back to `<ASSET_PATH>/pocket-guide/`, or restore the `private-backup-*` archive and copy from it.
2. Restore `file_path` with the `UPDATE … FROM bkp_136_mst_pocket_guides_file_path` block at the bottom of migration 136. The backup table keeps the values from the first run.
3. Redeploy the previous code.

The permission rows and the email template can stay.

**Local dev (2026-10-04):** files already moved by hand into `private-files/pocket-guide/`. The dry run reports 19 already private, 1 case fix (`Partyguide.pdf` → `PartyGuide.pdf`, guide 24), and 2 missing: guides 34 and 35 (Khichdi Diet R / Khichdi Diet, `1694279594335-390517095.pdf` and `1694279571195-587037212.pdf`). Migration 136 was dry-run in a rolled-back transaction: 22 rows rewritten, 7 permission rows, 1 template. A second run in the same transaction changed nothing.
