# Requirements: Pocket Guide Download

| Field | Value |
|-------|-------|
| Status | In Review |
| Branch | `invoice-seq-non-gst` (owner decision for this session); PR into `m3-cms-update` |
| Roadmap | Phase 4: 4.2 Pocket-guide download URL |
| References | BR-7 (Pocket Guides), PRD §3 story 20 |
| Apps touched | server_1 / eatfit247-admin / shared-library / db_changes / infra |

## Context

Pocket guides are standard EatFit247 PDFs (Detox Diet, Travel Guide, Diwali Guide…). A nutritionist assigns them to a member according to the member's needs. Once a guide is assigned, staff download it and share it with the member over WhatsApp, email or another channel.

The guides are **EatFit247's private property**. They must never be reachable through a public URL. Today they are: uploads land in the static `/media-files/pocket-guide/` folder, which admin-api serves without authentication and every Nginx config proxies.

Other gaps today:

- **Admin → Pocket Guide list:** no way to open or download the PDF. The "View" action is an empty stub, and four columns (URL, Views, Shares, Visible) point at fields that don't exist on `IPocketGuide`.
- **Admin → Member → Pocket Guide tab:** the API doesn't return the file at all, so there is nothing to download. The header button is mislabelled "Add Body Stats Log".
- **Assignment email** (`MEMBER_POCKET_GUIDE_ASSIGNED`): lists guide names only, and its template row may not exist in `mst_email_templates` (no migration creates it).

## User Stories

- As a **nutritionist**, I want to download a pocket guide I assigned to a member, so that I can send it to them on WhatsApp.
- As a **franchise admin**, I want to download any pocket guide from the master list and from my members' tabs, so that I can share it with members.
- As a **member**, I want the assigned guides attached to the assignment email, so that I receive them without needing an account or a link.
- As **EatFit247**, I want guide PDFs to be unreachable without staff login, so that our content isn't freely redistributed through public URLs.

## Scope

**In scope**
- Private storage for pocket-guide PDFs: new uploads and the existing files
- Authenticated, RBAC-checked download from the admin Pocket Guide list and the member Pocket Guide tab
- Attaching newly assigned guides to the assignment email, and making sure the email template exists
- Cleaning up the admin list columns, the "View" stub and the member-tab button label
- Granting `franchise_admin` and `nutritionist` full management (read/create/update/delete) on `PocketGuide`

**Out of scope**
- Personalising PDFs (stamping the member's name). Guides are standard items.
- Member self-service download on the website (roadmap Phase 9)
- Download or share analytics (view/share counts)
- Making the pocket-guide **thumbnail images** private (they stay public)
- Sending through WhatsApp from the platform (staff share manually)

## Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **Static PDFs, no personalisation** | Guides are standard items assigned by need. The BRD wording about personalising with member names is superseded. |
| 2 | **No public URL. PDFs live in a private folder outside the served `/media-files` root** | Guides are EatFit247 property. A folder that isn't served can't leak through a missed Nginx or serve-static rule ("block in place" was rejected for exactly that reason). |
| 3 | **Downloads go only through authenticated admin-api endpoints** (JWT + `@RequireAbility`) | Admin keeps the access token in memory, so the UI fetches the file over XHR (as a blob) and saves it. A plain `<a href>` can't carry the token. |
| 4 | **Two download endpoints:** master `PocketGuide` (Read) and member-scoped `MemberPocketGuide` (Read) | The member route has to enforce franchise isolation (principle 3) and only serve guides actually assigned to that member. |
| 5 | **Reuse the `read` action. No new `download` action** | The RBAC design allows only the 4 actions (read, create, update, delete). |
| 6 | **Roles: Super Admin (via `grant_all`), Franchise Admin and Nutritionist get full management of the `PocketGuide` master (read/create/update/delete)** | Owner decision: guides are platform-level resources, and anyone who works on diets or manages members can check and work on them. Franchise Admin includes partner-franchise owners. Today Nutritionist has only `read` and Franchise Admin has nothing, so a migration seeds the rest. |
| 6a | **Inactive guides can be downloaded** by any role with `PocketGuide` read | The same roles fully manage guides. `active = false` only stops new assignments. |
| 7 | **The assignment email attaches the newly assigned PDFs** | The member gets the file without any public link. The email service already supports attachments. |
| 8 | **Thumbnails (`image_path`) stay in public `/media-files`** | They're only cover images, and the admin list shows them through the shared image component. |

## Technical Constraints

- **Storage:** a new private storage root (env-configured, on the persistent Docker volume, **included in `infra/backup-media.sh`**). Uploads with `mediaFor = pocket-guide` and a PDF/document file are written there. The stored `file_path` must not resolve to a public URL.
- **Data:** migration `db_changes/136_pocket_guide_private_files.sql` rewrites `mst_pocket_guides.file_path` to the private location, seeds `franchise_admin` and `nutritionist` → `PocketGuide` → read/create/update/delete (decision 6), and inserts the assignment email template (`member_pocket_guide_assigned`) if it's missing. Existing PDFs are moved on the VPS as a scripted ops step, applied in the same release.
- **API (admin-api):** a file-stream response with `Content-Type: application/pdf` and a friendly `Content-Disposition` filename. List and detail responses stop exposing a downloadable URL for the PDF, and instead expose a flag such as `hasFile`.
- **Contract:** update `IPocketGuide` and `IMemberPocketGuide` in shared-library to carry what the UI needs (file present, display filename). Remove nothing that other screens still use.
- **RBAC:** `PocketGuide` (not franchise-scoped) for the master download. `MemberPocketGuide` (franchise-scoped) for the member download. The member must belong to one of the caller's franchises, unless the caller has the grant-all role.
- **Email:** attachments are read from private storage on the server. A missing file must not block the assignment; log it and send without that attachment.
- **Soft delete:** an inactive guide can't be newly assigned (existing behaviour) but can still be downloaded from the master list and from members it was already assigned to. `delete` permission means deactivation only; rows are never removed.

## Principle Check

- ✅ Franchise isolation: the member-scoped download checks franchise membership.
- ✅ Permissions live in data: access comes through seeded permission rows, with no role checks in code.
- ✅ Soft delete: no rows deleted.
- ✅ One contract: interface changes go in shared-library.
- ⚠️ Automated proof: there is no test harness yet (Phase 5). This feature adds Jest service tests; Playwright e2e is deferred and listed in `validation.md`.

## Open Questions

- [x] ~~Inactive guide downloads~~: allowed for all roles with `PocketGuide` read (owner, 2026-10-04)
- [ ] Production PDF sizes: if the total attachment size for a multi-guide assignment can exceed about 15 MB, split it across emails or cap it. (The local copies are about 4 KB placeholders.)
