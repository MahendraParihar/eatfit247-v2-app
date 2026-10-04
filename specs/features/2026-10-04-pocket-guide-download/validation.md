# Validation: Pocket Guide Download

## Acceptance Scorecard

| # | Criterion | How verified | Result |
|---|-----------|--------------|--------|
| A1 | Given a guide with a PDF, when a Nutritionist or Franchise Admin clicks **Download** in the Pocket Guide list, then the PDF is saved with a readable filename | Browser (both roles) | ☐ |
| A2 | Given a member with assigned guides, when staff with access click **Download** on the member's Pocket Guide tab, then that guide's PDF is saved | Browser | ☐ |
| A3 | Given **no** login, when anyone requests the PDF by any URL (`/media-files/pocket-guide/*.pdf`, the old `webUrl`, direct private paths), then they get 401/403/404 and never the file | curl against local Docker + Nginx | ☐ |
| A4 | Given a member in franchise B, when a Nutritionist mapped only to franchise A calls the member download endpoint, then the response is 403/404 | curl with that nutritionist's token; Jest | ☐ |
| A5 | Given a guide that is **not** assigned to the member, when the member download endpoint is called for it, then the response is 404 | curl; Jest | ☐ |
| A6 | Given a role without `PocketGuide` read (e.g. Social Content Manager), when it calls the master download, then the response is 403 and the menu item is hidden | curl + browser | ☐ |
| A7 | When a nutritionist assigns new guides, then the member's email has those PDFs attached (only the newly assigned ones) | Local mail catcher / test inbox | ☐ |
| A8 | Given a guide whose file is missing on disk, then assignment still succeeds, the email sends without that attachment, the error is logged, and the download shows a clear error | Jest + browser | ☐ |
| A9 | After a new PDF is uploaded through admin, it lands in private storage (not under the static root) and downloads correctly | Browser + `ls` on the volume | ☐ |
| A10 | The admin list has no broken columns (URL/Views/Shares/Visible are gone), and the member tab button reads "Assign Pocket Guide" | Browser | ☐ |
| A11 | Given an **inactive** guide, a Franchise Admin and a Nutritionist can download it from the master list; both roles can also create, edit and deactivate guides | Browser (both roles) | ☐ |
| A12 | Existing production guides still download after migration `136` and the file-move script | Run on a copy of the production DB + media | ☐ |

## Automated Checks

- [ ] `cd shared-library && npm run build`
- [ ] `cd server_1 && npx nx affected --target=lint,test,build`. The Jest specs for `PocketGuideService` and `MemberPocketGuideService` cover A4, A5, A7 and A8.
- [ ] `cd eatfit247-admin && npx nx affected --target=lint,build`
- [ ] Migration `136` applies cleanly on a fresh DB and on a copy of the production DB
- [ ] The file-move script's dry run reports 0 missing files on the production copy (or lists each missing one)

## Manual Checks

- [ ] curl: authenticated master and member downloads return `200` with `Content-Type: application/pdf`; unauthenticated returns `401`
- [ ] Browser: admin Pocket Guide list + member tab as Super Admin, Franchise Admin and Nutritionist
- [ ] RBAC cache flushed (or users re-logged-in) after the permission seed; Franchise Admin now sees the Pocket Guide menu, and both roles see Create/Edit/Status actions

## Deferred (Phase 5 harness)

- [ ] Playwright e2e: log in as a nutritionist → assign a guide → download from the member tab
- [ ] Integration test: an unauthenticated GET to the old public path returns 404 through Nginx

## Review

- [ ] Diff reviewed against `requirements.md` (decisions 1–8 honoured)
- [ ] Deep review by subagents: path traversal in file streaming, franchise leakage, private files not exposed through any static route, and no `any`
- [ ] Specs updated for every fix made during review

## Rollout

1. Deploy code (the private storage root exists, and uploads go there).
2. Run the file-move script on the VPS (dry run first).
3. Apply `db_changes/136_pocket_guide_private_files.sql`.
4. Flush the RBAC permission cache.
5. Smoke test A1–A3 in production.

Rollback: the old public files are **moved, not copied**. To roll back, move them back and restore `file_path` from the migration's backup table or file.
