# Validation: Workshop Invoices

> How we know the feature is done and correct. The agent runs every automated check. A human runs the manual checks and signs off on the review.
>
> **Pre-condition (local DB).** The local DB has migrations 137–149 from the tax branches applied, including a `series` column and two EFMUM 2026-27 service counter rows (DOMESTIC and EXPORT). This branch's `generateInvoiceNumber` doesn't know about `series`, so it could increment the wrong row. Run the walk-through on a production-like copy at migration 136 plus 151, or record the counter rows before and after and restore them. The renumbering script needs the production-like copy: the 17 Oct local copy also has 7 test invoices in the new `EFM/2627/S/…` format and a DOMESTIC counter at 498, so the script's gap guard would (correctly) refuse it.

## Acceptance Scorecard

| # | Criterion (Given / When / Then) | How verified | Result |
|---|---------------------------------|--------------|--------|
| A1 | Given EFMUM and a bill-to party in Maharashtra without a GSTIN, when a Financial Manager saves 200 × ₹850, then taxable is ₹170,000, CGST ₹15,300 + SGST ₹15,300, total ₹200,600, and the tax result is stored on the row. | unit test + curl | ☐ |
| A2 | Given a bill-to party in another State, when 174 × ₹850 is saved, then IGST is ₹26,622 and the total is **₹174,522**. | unit test + curl | ☐ |
| A3 | Given a PENDING invoice, when it is saved, then it has no number, and the PDF endpoint returns 400. | unit test + curl | ☐ |
| A4 | Given a PENDING invoice, when it is moved to PAID, then it gets the next number in the franchise's **S series** (the same counter as member service invoices), and moving it again never issues a second number. | unit test + DB check | ☐ |
| A5 | Given the save fails after the number is generated, when the transaction rolls back, then the counter is unchanged (no gap). | unit test | ☐ |
| A6 | Given an invoice date of 11 Aug 2026 issued on a later day, then the FY is 2026-27 (from the invoice date). A future date is refused (400), and a date in FY 2025-26 is refused (400). | unit test | ☐ |
| A7 | Given the S series already has an invoice dated after the chosen invoice date, when saving without confirmation, then the API returns a warning naming that date and nothing is saved. With confirmation it saves. | unit test + browser | ☐ |
| A8 | Given an issued invoice, when quantity, rate, description, currency, State, place of supply, invoice date or supply date is changed, then 400. When the name, address lines, email, phone, notes or payment reference is changed, then it saves. | unit test + curl | ☐ |
| A9 | Given an issued invoice, when it is cancelled with a reason, then `active = false`, the number is kept, the PDF shows CANCELLED, and the next invoice takes the next number. | unit test + browser | ☐ |
| A10 | The PDF shows the bill-to name, address and GSTIN (if any), the description "Gut reset programme workshop", the SAC (same as production's `DIET_SAC_CODE`; no SAC input on the form), qty, unit rate, taxable value, CGST/SGST or IGST, total, amount in words, invoice date, **date of supply** and place of supply, with the workshop terms. | browser (PDF) | ☐ |
| A11 | The place of supply defaults to the bill-to State. When it is changed to another State, the tax switches between CGST+SGST and IGST. | unit test + browser | ☐ |
| A12 | A role without `WorkshopInvoice` permission gets 403 on every endpoint, and the menu item is hidden. An admin mapped only to HCUAE can't list or open an EFMUM workshop invoice (404/403). | curl + browser | ☐ |
| A13 | Member payment invoices are unchanged: same numbering, FY from today, same PDF. | existing specs + one PDF diff | ☐ |
| A14 | The PDF isn't written under `media-files/`. | file-system check | ☐ |
| A15 | The three real invoices (200 / 200 / 174) are created locally with totals ₹200,600 / ₹200,600 / ₹174,522 and, after the script, numbers N+1…N+3. | browser + DB check (plan group 8) | ☐ |
| A16 | When a required bill-to field (legal name, address line 1, city, country, State, pincode) is missing, or the pincode, email or GSTIN format is wrong, then the API returns 400 and the form shows the field error. The admin-entered details print on the PDF exactly as entered. | unit test + browser | ☐ |
| A17 | Given the three workshop invoices are PENDING and dated 11 Aug 2026, when the renumbering script runs **without** `--apply`, then it prints N (the highest S number dated on or before 11 Aug), the three new numbers and the full old → new list, writes the CSV, and changes nothing in the DB. | script test + local dry run | ☐ |
| A18 | When the script runs with `--apply`, then: the three invoices are PAID with N+1, N+2 and N+3 (in the given order); every S number above N, in both tables, moved up by exactly 3; the counter grew by 3; the series is 1…counter with no gap or duplicate; dates, amounts and tax are unchanged; P invoices and other franchises are unchanged. | script test + DB check | ☐ |
| A19 | Every changed row has a `txn_invoice_renumber_log` entry with old and new numbers under one run ID: shifted count + 3 rows. | script test + DB check | ☐ |
| A20 | The script refuses (exit non-zero, nothing written) when: run a second time for the same invoices; any of the three is missing, inactive, not PENDING, on another franchise, not dated 11 Aug, or lacks payment details; or the series already has a gap or duplicate. | script test | ☐ |
| A21 | Given an error part-way through the apply, then the whole run rolls back (numbers, counter and log unchanged). While the script holds the counter lock, a concurrent member payment marked PAID waits and then gets the next number after the run. | script test | ☐ |
| A22 | After the run, a member invoice PDF downloaded for a moved invoice shows its new number. | browser | ☐ |

## Automated Checks

- [ ] `cd shared-library && npm run build`
- [ ] `cd server_1 && npx nx affected --target=lint,test,build` (includes the new `invoice-sequence` and `workshop-invoice` specs)
- [ ] `cd eatfit247-admin && npx nx affected --target=lint,test,build`
- [ ] Migration 151 applies cleanly on a fresh DB and on a copy of production data (at 136), and re-runs without error.

**To add when the harnesses exist (5.3 / 5.4):**
- An endpoint integration test per route against the seeded test DB (A1–A9, A12).
- A Playwright flow: Financial Manager creates, pays, downloads and cancels.

## Manual Checks

- [ ] API: curl list / get / calculate-tax / create / update / cancel / PDF (happy path + one failure each).
- [ ] UI: walk the create → PAID → PDF → cancel flow in the admin as Financial Manager, including the backdate confirmation dialog.
- [ ] RBAC: a Nutritionist is denied. An admin from another franchise can't see the data.
- [ ] Accounts checks the three PDFs against their note before anything is created in production.

## Review

- [ ] Diff reviewed at the requirements level: does the code do what `requirements.md` says?
- [ ] Deep review by subagents (bugs, security / franchise leakage, invoice gaps, conventions). Findings fixed or logged.
- [ ] Specs and code are in sync. Every fix made during review is reflected back into `requirements.md` / `plan.md`.
- [ ] I can explain the change (read the key tests, run them under the debugger if needed).

## Gate log

| Date | Gate | Result | Notes |
|------|------|--------|-------|
| 2026-10-26 | G1 migration | ✅ | `eatfit_wi`: 151 applied twice (second run only NOTICEs); table, checks, FKs and indexes as specified; WorkshopInvoice (subject 48, franchise-scoped) has read/create/update/delete for roles 1 and 7. A fresh-DB run isn't possible locally (no seeded empty schema); covered by the production-copy run. |
| 2026-10-26 | G2 shared library | ✅ | `npm run build` clean. Member invoice HTML rendered through `MemberPlanService.generateInvoicePDF` (stopped before Puppeteer) is byte-identical with the old and new `invoice.hbs` for payment 5277 (DOMESTIC_GST, EFMUM/2026-27/S/000491) and 5276 (NO_TAX foreign customer, S/000490). The first run differed only by a new CSS rule; moved inline and re-ran. G1 re-run: no schema change since. |

## Release Notes (production)

1. [ ] Apply `151_workshop_invoices.sql` and deploy.
2. [ ] Get the CA's answer on the place of supply. The admin then creates the three workshop invoices as **PENDING**, with invoice date and supply date 11 Aug 2026, the organiser's legal name, address and State, and payment details. Accounts checks the totals.
3. [ ] Re-confirm with Accounts on the day that GSTR-1 is still unfiled for Aug 2026 onward. If any month is filed, **stop**: the renumbering doesn't run.
4. [ ] Back up the database (`pg_dump` of `txn_member_payments`, `txn_workshop_invoices` and `mst_invoice_sequences` at least).
5. [ ] Dry run on production. Accounts approves N, the three new numbers and the old → new CSV.
6. [ ] Run with `--apply` at a quiet time; the counter lock makes new PAID entries wait for the few seconds it runs.
7. [ ] Check: series 1…counter with no gap or duplicate; the three invoices PAID at N+1…N+3; the log row count matches.
8. [ ] Give Accounts the CSV to correct Tally and to decide on re-sending PDFs to clients whose numbers changed.
9. [ ] Run the renumbering before the 4.5–4.14 migrations (145) reach production.
