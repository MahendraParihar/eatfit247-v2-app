# Validation: Workshop Invoices

> How we know the feature is done and correct. The agent runs every automated check. A human runs the manual checks and signs off on the review.
>
> **Pre-condition (local DB).** The local DB has migrations 137–149 from the tax branches applied, including a `series` column and two EFMUM 2026-27 service counter rows (DOMESTIC and EXPORT). This branch's `generateInvoiceNumber` doesn't know about `series`, so it could increment the wrong row. Run the walk-through on a production-like copy at migration 136 plus 151, or record the counter rows before and after and restore them. The renumbering script needs the production-like copy: the 17 Oct local copy also has 7 test invoices in the new `EFM/2627/S/…` format and a DOMESTIC counter at 498, so the script's gap guard would (correctly) refuse it.

## Acceptance Scorecard

| # | Criterion (Given / When / Then) | How verified | Result |
|---|---------------------------------|--------------|--------|
| A1 | Given EFMUM and a bill-to party in Maharashtra without a GSTIN, when a Financial Manager saves 200 × ₹850, then taxable is ₹170,000, CGST ₹15,300 + SGST ₹15,300, total ₹200,600, and the tax result is stored on the row. | unit test + curl | ✅ |
| A2 | Given a bill-to party in another State, when 174 × ₹850 is saved, then IGST is ₹26,622 and the total is **₹174,522**. | unit test + curl | ✅ |
| A3 | Given a PENDING invoice, when it is saved, then it has no number, and the PDF endpoint returns 400. | unit test + curl | ✅ |
| A4 | Given a PENDING invoice, when it is moved to PAID, then it gets the next number in the franchise's **S series** (the same counter as member service invoices), and moving it again never issues a second number. | unit test + DB check | ✅ |
| A5 | Given the save fails after the number is generated, when the transaction rolls back, then the counter is unchanged (no gap). | unit test | ✅ |
| A6 | Given an invoice date of 11 Aug 2026 issued on a later day, then the FY is 2026-27 (from the invoice date). A future date is refused (400), and a date in FY 2025-26 is refused (400). | unit test | ✅ |
| A7 | Given the S series already has an invoice dated after the chosen invoice date, when saving without confirmation, then the API returns a warning naming that date and nothing is saved. With confirmation it saves. | unit test + browser | ✅ |
| A8 | Given an issued invoice, when quantity, rate, description, currency, State, place of supply, invoice date or supply date is changed, then 400. When the name, address lines, email, phone, notes or payment reference is changed, then it saves. | unit test + curl | ✅ |
| A9 | Given an issued invoice, when it is cancelled with a reason, then `active = false`, the number is kept, the PDF shows CANCELLED, and the next invoice takes the next number. | unit test + browser | ✅ |
| A10 | The PDF shows the bill-to name, address and GSTIN (if any), the description "Gut reset programme workshop", the SAC (same as production's `DIET_SAC_CODE`; no SAC input on the form), qty, unit rate, taxable value, CGST/SGST or IGST, total, amount in words, invoice date, **date of supply** and place of supply, with the workshop terms. | browser (PDF) | ✅ |
| A11 | The place of supply defaults to the bill-to State. When it is changed to another State, the tax switches between CGST+SGST and IGST. | unit test + browser | ✅ |
| A12 | A role without `WorkshopInvoice` permission gets 403 on every endpoint, and the menu item is hidden. An admin mapped only to HCUAE can't list or open an EFMUM workshop invoice (404/403). | curl + browser | ✅ |
| A13 | Member payment invoices are unchanged: same numbering, FY from today, same PDF. | existing specs + one PDF diff | ✅ |
| A14 | The PDF isn't written under `media-files/`. | file-system check | ✅ |
| A15 | The three real invoices (200 / 200 / 174) are created locally with totals ₹200,600 / ₹200,600 / ₹174,522 and, after the script, numbers N+1…N+3. | browser + DB check (plan group 8) | ✅ |
| A16 | When a required bill-to field (legal name, address line 1, city, country, State, pincode) is missing, or the pincode, email or GSTIN format is wrong, then the API returns 400 and the form shows the field error. The admin-entered details print on the PDF exactly as entered. | unit test + browser | ✅ |
| A17 | Given the three workshop invoices are PENDING and dated 11 Aug 2026, when the renumbering script runs **without** `--apply`, then it prints N (the highest S number dated on or before 11 Aug), the three new numbers and the full old → new list, writes the CSV, and changes nothing in the DB. | script test + local dry run | ✅ |
| A18 | When the script runs with `--apply`, then: the three invoices are PAID with N+1, N+2 and N+3 (in the given order); every S number above N, in both tables, moved up by exactly 3; the counter grew by 3; the series is 1…counter with no gap or duplicate; dates, amounts and tax are unchanged; P invoices and other franchises are unchanged. | script test + DB check | ✅ |
| A19 | Every changed row has a `txn_invoice_renumber_log` entry with old and new numbers under one run ID: shifted count + 3 rows. | script test + DB check | ✅ |
| A20 | The script refuses (exit non-zero, nothing written) when: run a second time for the same invoices; any of the three is missing, inactive, not PENDING, on another franchise, not dated 11 Aug, or lacks payment details; or the series already has a gap or duplicate. | script test | ✅ |
| A21 | Given an error part-way through the apply, then the whole run rolls back (numbers, counter and log unchanged). While the script holds the counter lock, a concurrent member payment marked PAID waits and then gets the next number after the run. | script test | ✅ |
| A22 | After the run, a member invoice PDF downloaded for a moved invoice shows its new number. | browser | ✅ |

## Automated Checks

- [x] `cd shared-library && npm run build`
- [x] `cd server_1 && npx nx affected --target=lint,test,build` (includes the new `invoice-sequence` and `workshop-invoice` specs). As run: server_1 has no lint target; `nx test` platform/member/workshop-invoice pass (google.service.spec fails to load on the base too); admin-api and public-api `tsc --noEmit` clean (a webpack build would have written into the `dist` used by the running dev server).
- [x] `cd eatfit247-admin && npx nx affected --target=lint,test,build`. As run: new files lint clean; core/shared-ui tests pass; the production build compiles with the same 72 budget errors as the base.
- [x] Migration 151 applies cleanly on a fresh DB and on a copy of production data (at 136), and re-runs without error. As run: on the production copy only (no seeded empty schema locally).

**To add when the harnesses exist (5.3 / 5.4):**
- An endpoint integration test per route against the seeded test DB (A1–A9, A12).
- A Playwright flow: Financial Manager creates, pays, downloads and cancels.

## Manual Checks

- [x] API: curl list / get / calculate-tax / create / update / cancel / PDF (happy path + one failure each).
- [x] UI: walk the create → PAID → PDF → cancel flow in the admin as Financial Manager, including the backdate confirmation dialog.
- [x] RBAC: a Nutritionist is denied. An admin from another franchise can't see the data.
- [ ] Accounts checks the three PDFs against their note before anything is created in production.

## Review

- [x] Diff reviewed at the requirements level: does the code do what `requirements.md` says?
- [x] Deep review by subagents (bugs, security / franchise leakage, invoice gaps, conventions). Findings fixed or logged.
- [x] Specs and code are in sync. Every fix made during review is reflected back into `requirements.md` / `plan.md`.
- [ ] I can explain the change (read the key tests, run them under the debugger if needed).

## Gate log

| Date | Gate | Result | Notes |
|------|------|--------|-------|
| 2026-10-26 | G1 migration | ✅ | `eatfit_wi`: 151 applied twice (second run only NOTICEs); table, checks, FKs and indexes as specified; WorkshopInvoice (subject 48, franchise-scoped) has read/create/update/delete for roles 1 and 7. A fresh-DB run isn't possible locally (no seeded empty schema); covered by the production-copy run. |
| 2026-10-26 | G2 shared library | ✅ | `npm run build` clean. Member invoice HTML rendered through `MemberPlanService.generateInvoicePDF` (stopped before Puppeteer) is byte-identical with the old and new `invoice.hbs` for payment 5277 (DOMESTIC_GST, EFMUM/2026-27/S/000491) and 5276 (NO_TAX foreign customer, S/000490). The first run differed only by a new CSS rule; moved inline and re-ran. G1 re-run: no schema change since. |
| 2026-10-26 | G3 numbering by date | ✅ | `nx test platform`: `invoice-sequence.service.spec` 13 tests pass (FY on both sides of 1 Apr, Jan-FY franchise, default = today incl. 31 Mar, two issues → 000492/000493 on one row under `FOR UPDATE`, bad date rejected) + diet-plan spec. `google.service.spec` fails to load (`InputLengthEnum.IP` undefined), pre-existing on the base. `nx test member` 23/23. Callers grep: member-plan, member-product, webhook ×2 all pass 5 args (no date) → unchanged. G1/G2 unchanged since (no schema or shared-lib edits). |
| 2026-10-26 | G4 backend domain | ✅ | `nx test workshop-invoice` 63/63: 200/174 × ₹850 with CGST+SGST and IGST (real `TaxEngineService` + `IndiaGstService`, Tax Master stubbed at 18%), odd-paisa split, stored tax result, number only on PAID and once, rollback leaves a commit-only fake counter at 491, SAC copied at issue, cancel keeps number, date rules incl. IST-vs-UTC today, backdate 409 naming 25 Oct 2026, payment details, DTO bill-to validation, Indian pincode, locked vs editable fields, 404/403 scoping, list filter. `tsc` on the lib and spec clean (the only error is the known `file-upload.controller.ts` one). Lint: server_1 has no ESLint config/target. Re-run: platform 16 ✅ (+ known google.service.spec load failure), member 23 ✅. |
| 2026-10-26 | G5 admin API (live) | ✅ after 5b | Second admin-api on :3002 against `eatfit_wi` (email off, courier accounts inactive and pointed at 127.0.0.1:9 in that clone only); QA users 19 super admin, 20 FM EFMUM, 21 FM HCUAE, 22 nutritionist; tokens minted with the access secret. Preview 200×₹850 MH → CGST 15,300 + SGST 15,300 = ₹200,600 (A1); 174×₹850 POS Karnataka → IGST 26,622 = ₹174,522 (A2, A11); qty 0 → 400. Create PENDING → no number, PDF 400 (A3). Missing name / bad GSTIN → 400, 5-digit pincode → 400 with message (A16). Future date and 31 Mar 2026 → 400 (A6). PAID dated 1 Oct → 409 "…already has an invoice dated 14 Oct 2026…", nothing saved, counter 491; with confirm → S/000492, SAC 999319, locked (A4, A7). Save again → same number; qty change → 400 naming quantity; name/email change → 200, totals unchanged (A8). HCUAE FM: get → 404, list → empty, preview → 404; nutritionist → 403 (A12). PDF read: all A10 fields incl. date and place of supply, SAC, tax split, workshop terms; cancel without reason → 400; cancel → active false, number kept, PDF stamped CANCELLED; editing a cancelled row → 400; next invoice → S/000493 (A9). No file written under `media-files/` (A14). 5b fixes: rate stored as number; amount in words ("Rupees One Lakh Seventy Four Thousand Five Hundred Twenty Two Only"). Re-run: G2 member HTML identical, platform 16, member 23, workshop-invoice 67. |
| 2026-10-26 | G6 admin CMS | ✅ | Production build compiles; the 72 budget errors and 1.38 MB initial bundle are identical on the base (checked by stashing the admin changes; this adds ~1 kB). ESLint on the new lib and touched core/shared-ui files: no errors (core's circular-dependency lint errors are pre-existing). Tests: core `navigation.service.spec` 4/4, shared-ui 16/16, the new lib has no specs. Browser on a temporary admin (:4201, `wi` configuration pointing at :3002 / `eatfit_wi`, not committed) as QA FM EFMUM: Finance → Workshop Invoices visible; list with strike-through for cancelled rows; empty submit → field errors; bad GSTIN, email and 5-digit pincode → field errors (A16); place of supply defaults to Maharashtra, live preview CGST/SGST ₹13,311 each = ₹1,74,522, switching to Karnataka → IGST ₹26,622 (A11); invoice date 1 Oct + Paid → dialog "…already has an invoice dated 26 Oct 2026…", no error snackbar, confirm → saved as S/000494 (A7); edit shows locked fields disabled, notes edit → PUT 200 (A8); cancel dialog requires a reason, then the row shows Cancelled (A9); PDF download 200; "Show cancelled" filter works. As QA nutritionist: no Finance section or Workshop Invoices item (A12). |
| 2026-10-26 | G7 renumbering script | ✅ | `TEMPLATE_DB=eatfit_wi_tpl node --experimental-strip-types --test scripts/workshop-invoice-renumber.test.ts`: 14/14 on clones of the 14 Oct production copy (S 1…491) + 151. Dry run → prints N, writes the CSV, snapshot unchanged (A17). Apply → workshops at N+1…N+3, PAID, SAC set, totals 200,600/200,600/174,522; every member S number above N +3, the rest unchanged; series 1…counter+3; counter +3; log = shifted + 3 rows under one run ID; rows at or below N dated after the cut-off stay; P and other series, dates, amounts and tax unchanged; second run refused (A18, A19, A20). Each precondition (cancelled, not PENDING, other franchise, wrong date, no reference, no mode, already numbered, missing ID), a gap and a cross-table duplicate → exit 2, snapshot unchanged (A20). Failure injected at the 5th log row → exit 1, everything rolled back. A concurrent `SELECT … FOR UPDATE` on the counter waited for the run, then got counter+4 (A21). The first run found an unused `$1` in the series query (bound but not referenced); it now filters by franchise too. `tsc --strict` on both files clean. |
| 2026-10-26 | G8 walk-through | ✅ | `eatfit_wi8` (fresh clone, S 1…491). API as QA FM: 200/200/174 × ₹850, PENDING, invoice and supply date 11 Aug, payment details → ids 1–3, no numbers, totals ₹200,600/₹200,600/₹174,522 (CGST+SGST). Dry run: N = `EFMUM/2026-27/S/000351`, 1–3 → 352/353/354, 140 later invoices +3 (000352 → 000355 … 000491 → 000494), as in requirements. Apply: workshops PAID at 352–354 with SAC 999319; counter 491 → 494; series 1…494, no gap or duplicate; log 143 rows / 1 run; a second run refused (exit 2) (A15, A18, A19). Member invoices for moved payments 5277 and 5131 render as S/000494 and S/000355 (A22). Workshop PDFs 352 and 354 show the description, SAC, qty 200/174, ₹850, CGST/SGST, totals, amount in words, invoice and supply date 11 Aug, place of supply Maharashtra (A10). One more PAID invoice → S/000495 (no gap); cancelled → number kept, PDF stamped CANCELLED (A9). |
| 2026-10-26 | G9 review + 9b | ✅ | Two review subagents: no blockers; 9b fixes in plan.md. `nx test workshop-invoice` 71/71 (new: impossible dates, too-large amount, read-back failure after commit leaves the commit alone). Live on :3002/`eatfit_wi8`: `2026-02-30` → 400; 100000 × 10,000,000 → 400 "too large"; normal PAID create → S/000496 and its PDF 200. Admin: lint clean, build compiles. G1–G8 not affected (no schema, numbering, script or template change). |

## Release Notes (production)

1. [ ] Apply `151_workshop_invoices.sql` and deploy.
   - Then clear the cached admin permissions, or Super Admin and Financial Manager get 403 and no Finance menu for up to an hour (Redis TTL 3600 s): `redis-cli --scan --pattern 'rbac:permissions:*' | xargs -r redis-cli del` (add `-n <REDIS_DB>` / auth as configured). Admins then refresh the admin page.
2. [ ] Get the CA's answer on the place of supply. The admin then creates the three workshop invoices as **PENDING**, with invoice date and supply date 11 Aug 2026, the organiser's legal name, address and State, and payment details. Accounts checks the totals.
3. [ ] Re-confirm with Accounts on the day that GSTR-1 is still unfiled for Aug 2026 onward. If any month is filed, **stop**: the renumbering doesn't run.
4. [ ] Back up the database (`pg_dump` of `txn_member_payments`, `txn_workshop_invoices` and `mst_invoice_sequences` at least).
5. [ ] Dry run on production. Accounts approves N, the three new numbers and the old → new CSV.
   - Command (inside admin-api, from `/home/app/server_1`): `node --experimental-strip-types workshop-invoice-renumber.ts --franchise-id 1 --cutoff 2026-08-11 --invoices <id1>,<id2>,<id3> --admin-id <your admin id>` (copy the script in first; see its header). Needs Node ≥ 22.6.
   - Before it, check `SELECT * FROM txn_invoice_renumber_log` is empty: the replay guard only knows the three IDs it is given.
   - The dry run also holds the counter lock while it runs (seconds), so run it, like the apply, at a quiet time.
6. [ ] Run with `--apply` at a quiet time; the counter lock makes new PAID entries wait for the few seconds it runs.
7. [ ] Check: series 1…counter with no gap or duplicate; the three invoices PAID at N+1…N+3; the log row count matches.
8. [ ] Give Accounts the CSV to correct Tally and to decide on re-sending PDFs to clients whose numbers changed.
9. [ ] Run the renumbering before the 4.5–4.14 migrations (145) reach production.
