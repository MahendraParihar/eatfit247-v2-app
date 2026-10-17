# Plan: Compliant Invoice Numbering and Unregistered Turnover Warning

> Source: [requirements.md](./requirements.md) · Done when: [validation.md](./validation.md) passes
>
> Invoices, migrations and tax: implement **one group at a time**, live-test, review, and commit each group with explicit paths before starting the next.

## Group 0: Spec alignment (documents only)

- [x] 0.1 4.7 [requirements.md](../2026-10-10-invoice-number-non-gst/requirements.md):
  - add a status note: decisions 3 and 13–17 are superseded by this feature's decisions 1–5;
  - mark plan group 6 (migration 138) as retired.
- [x] 0.2 [4.6 validation release runbook](../2026-10-10-tax-engine-correctness/validation.md#release-runbook-45--47--46-ship-together):
  - replace the 138 steps with 145;
  - add "set EFMUM's and MEMUM's format on the franchise form (seeded by 145; confirm the preview)";
  - add "enter EFMUM's FY 2026-27 LUT".
- [x] 0.3 Tax-matrix [validation.md](../2026-10-10-tax-mapping-matrix/validation.md) pending list: link to this feature. Note for replanning: mission.md principle 2 needs new exception wording (requirements principle check).

## Group 1: Migration 145 and retiring 138

- [x] 1.1 `db_changes/145_compliant_invoice_numbering.sql`, idempotent, in one transaction:
  - `mst_franchises` columns: `invoice_prefix`, `invoice_number_format`, `registration_threshold_amount`, `turnover_alert_fy`, `turnover_alert_level`. Add CHECKs: prefix `^[A-Z0-9]{1,5}$`; level between 0 and 2.
  - Seed by `franchise_code`, only where NULL:
    - EFMUM → `EFM`, `{PREFIX}/{FY}/{TYPE}/{SEQ5}`;
    - MEMUM → `MEM`, same template, threshold 4000000.00.
  - Payment modes "Remittance via exchange house (RDA)" and "Remittance app (Remitly / Wise)", `payment_route = 'FOREIGN_REMITTANCE'`, guarded by `WHERE NOT EXISTS`.
  - (added in group 4) email template `admin_franchise_turnover_alert`, guarded by `WHERE NOT EXISTS`.
  - A header comment explaining why 138 is retired.
- [x] 1.2 `db_changes/138_fy2026_27_q2_invoice_renumber.sql`: replace the body with a `DO` block that raises an exception ("Retired by specs/features/2026-10-17-compliant-invoice-numbering decision 1. Do not run.") so nothing changes. Keep the old body in the git history only.
- [x] 1.3 `scripts/invoice-renumber/preview_fy2026_27_q2.sql`: add a retired header (the query is harmless and read-only, so it stays).
- [x] 1.4 Apply locally after 137–144:
  - 145 twice (no error, same rows);
  - 138 aborts with the retired message;
  - `\d mst_franchises` shows the new columns.
- [x] 1.5 Models: `MstFranchise` gets the new columns. `MstPaymentMode` needs no change.

> **As built (group 0, 2026-10-17):** 4.7 requirements carry a status note (decisions 3 and 13–17 superseded); 4.7 plan group 6 is headed RETIRED, 7.2 records the go-live counters only, and 8.3's "Later" item points here. The 4.6 runbook drops the 138 preview sign-off, applies 137, 139–144 then 145 (never 138), and step 6 adds the franchise format check and EFMUM's FY 2026-27 LUT. The tax-matrix pending list links here with the principle 2 replanning note.
>
> **As built (group 1, 2026-10-17):** the local `eatfit` DB is a fresh copy without 137–144, so the rehearsal ran on a clone (`eatfit_rh145`); afterwards 137, 139–145 were applied to `eatfit` itself (owner request, backup taken first; counters EFMUM service 491, MEMUM product 64): 137, 139–144, then 145 twice (second run: only "already exists" notices; franchise and payment-mode rows identical), 138 aborts with the retired message (exit 3), `\d mst_franchises` shows the five columns and both CHECKs, and a 6-character prefix, a lowercase prefix and level 3 are refused. New payment modes: 21 "Remittance via exchange house (RDA)", 22 "Remittance app (Remitly / Wise)". 138's original body: `git show db0918bd:db_changes/138_fy2026_27_q2_invoice_renumber.sql`. `MstFranchise` has the five columns; `nx` core typecheck green.

## Group 2: Shared library: format engine and contract

- [x] 2.1 `InvoiceNumberFormatUtil` (`core/invoice/`):
  - `render({ template, prefix, fyStartMonth, invoiceDate, typeLetter, sequence })`;
  - `validate(template, prefix, { gstLimit })` returns a list of errors: a prefix outside `^[A-Z0-9]{1,5}$`, unknown or repeated token, missing `{PREFIX}`, `{SEQn}` or `{TYPE}`, n outside 3–8, literal characters other than `/` and `-`, a worst-case render over 16 characters or failing the Rule 46 regex when `gstLimit`;
    - `{PREFIX}` is required because `invoice_id` and `credit_note_number` are unique across all franchises (review 2026-10-17); a template without it could collide with another franchise's numbers;
  - `typeLetter(invoiceType, series, isCreditNote)` gives S/E/P/X/C;
  - `RULE46_INVOICE_NUMBER = /^[A-Za-z1-9][A-Za-z0-9\/-]{0,15}$/`.
- [x] 2.2 `IFranchise.invoicePrefix`, `invoiceNumberFormat`, `registrationThresholdAmount`; `IFranchiseTurnover`; `TurnoverAlertLevel` enum (NONE 0, AMBER 1, RED 2).
- [x] 2.3 Spec file for the util. Cases:
  - EFM April FY → `EFM/2627/S/00492`;
  - January FY → `2026`;
  - every type letter;
  - SEQ3 and SEQ8;
  - 99999 still renders within 16;
  - a 6-character prefix, `{SEQ6}` with a 5-character prefix, a space, `_` and a leading `0` are all rejected;
  - a non-GST franchise is not held to 16.

  Then `npm run build`.

> **As built (group 2, 2026-10-17):** `shared-library/src/core/invoice/invoice-number-format.util.ts` exports `InvoiceNumberFormatUtil` (`render`, `fyToken`, `typeLetter`, `isRule46Compliant`, `validate`), `InvoiceTypeLetter` (S/E/P/X/C), `RULE46_INVOICE_NUMBER`, `INVOICE_PREFIX_PATTERN` and the length/digit limits. `validate` also requires `{PREFIX}` and rejects repeated tokens (see 2.1); under `gstLimit` it renders sequence 1 and all 9s for every type letter. `TurnoverAlertLevel` enum, `IFranchiseTurnover`, and the three optional fields on `IBaseFranchise` (so the manage DTO inherits them). The spec lives at `server_1/libs/platform/src/lib/utils/invoice-number-format.util.spec.ts` (shared-library has no test runner); platform's `jest.config.ts` gained the tsconfig-paths `moduleNameMapper` that member already had — without it the shared lib resolved to `index.d.ts` and every runtime export was undefined. 23/23 green; `google.service.spec` still fails as before. Shared lib build, `admin-api` + `public-api` builds, admin and web `tsc` all green.

## Group 3: Backend numbering (`server_1`, platform + member)

- [x] 3.1 `InvoiceSequenceService.generateInvoiceNumber` / `generateCreditNoteNumber`:
  - the request carries `invoicePrefix`, `invoiceNumberFormat` and `gstLimit` (Indian franchise);
  - with a template, render through the util, otherwise use the legacy format, unchanged;
  - same counter key, same `FOR UPDATE`.
- [x] 3.2 Issue-time guard (decision 7): with `gstLimit`, a render failing `RULE46_INVOICE_NUMBER` throws `BadRequestException` and logs at error level. The transaction rolls back, so no number is consumed.
- [x] 3.3 `InvoiceIssueService.franchiseContext` and `issue`, and `CreditNoteService`: pass the franchise's prefix, template and `gstLimit` (country IN).
- [x] 3.4 Franchise DTO and service: validate prefix and template with `InvoiceNumberFormatUtil.validate` (the limit applies when the franchise address country is IN), return 400 with the listed errors, and persist both. The prefix must also be unique among franchises, and must not equal another franchise's `franchise_code` (case-insensitive), for the same global-uniqueness reason.
- [x] 3.5 Unit tests:
  - EFMUM next number after counter 491 is `EFM/2627/S/00492`;
  - the first export is `EFM/2627/E/00001`;
  - MEMUM gives `MEM/2627/P/00065`;
  - HCUAE (no template) gives the unchanged `HCUAE/2026/S/000012`;
  - a credit note with a template gives `…/C/…`;
  - a guard failure consumes no number;
  - the franchise save rejects a too-long template.

  The existing numbering specs (`invoice-numbering.spec.ts`, invoice-on-paid, payment-confirmation) stay green. Run member, platform and franchise jest.

> **As built (group 3, 2026-10-17):**
> - `InvoiceSequenceService`: `IInvoiceNumberRequest` / `ICreditNoteNumberRequest` carry `invoicePrefix`, `invoiceNumberFormat`, `gstLimit`. Both generators share `nextNumber`, which locks the same counter row, renders `current + 1`, runs the Rule 46 guard, and only then saves the counter, so a refused number is not consumed even if a caller committed after catching the error (all four `issue` callers and the credit-note path roll back anyway). A template without a prefix falls back to the legacy format.
> - `InvoiceIssueService.numberFormat(context)` gives prefix, template and `gstLimit` (franchise country IN); used by `issue` and `CreditNoteService`. `FranchiseService.convertToModel` returns the three new fields.
> - `FranchiseService.numberingFields` (create and update): writes a key only when the payload has it, so the current admin form (group 5 not built yet) keeps the seeded format; validates the effective prefix + template on every save with the country from the payload address, else the stored one; rejects a prefix equal to another franchise's prefix or code; errors joined into one 400 message. DTO: `invoicePrefix`, `invoiceNumberFormat` (≤40), `registrationThresholdAmount` (≥0, 2 decimals).
> - Tests: member 321/321 (numbering spec +10 cases; the credit-note spec mock gained `numberFormat` and asserts it is passed), new franchise jest project (`jest.config.ts`, `tsconfig.spec.json`) with `franchise.service.spec.ts` 8/8, platform util spec 24/24 incl. the A7 property test. `admin-api` + `public-api` builds green.
> - Live (local `eatfit`, admin-api Nest context, one transaction rolled back, counter md5 identical after): EFMUM `EFM/2627/S/00492`, `EFM/2627/E/00001`, `EFM/2627/C/00001`; guard refused `EFMUM/2627/S/00493` and the next issue was still `…/00493`; HCUAE `HCUAE/2026/S/000012`, `HCUAE/2026/CN/000001`; MEMUM `MEM/2627/P/00065`, `MEM/2627/X/00001`, `MEM/2627/C/00001`; franchise save of `EFMUM` + `{SEQ6}` → 400 (19 characters), `MEM` on EFMUM → 400. Not yet done: a real PAID payment through the running admin-api / website (A3, A4, A6 "live"), to run with the group 5 browser check.

## Group 4: Turnover warning (`server_1`)

- [x] 4.1 `FranchiseTurnoverService.forFranchise(id)`:
  - current FY from the franchise's `financial_year` and `time_zone`;
  - sum of `coalesce(functional_total_amount, total_amount)` over plan payments and product orders with `invoice_id` set and `coalesce(invoice_date, payment_date)` in that FY (review 2026-10-17: every FY 2026-27 row issued before 137 has no `invoice_date`; product `payment_date` is a timestamp, taken in the franchise's timezone);
  - percent and level against `registration_threshold_amount`;
  - `level = NONE` when there is no threshold or the franchise has a GSTIN.
- [x] 4.2 `GET franchise/:id/turnover` (admin, `@RequireAbility(read, Franchise)`, franchise-scoped).
- [x] 4.3 `franchise-turnover.cron.ts` (daily), for each franchise with a threshold and no GSTIN:
  - compute the level;
  - when it is above `turnover_alert_level` for the same FY, or the FY changed, email super admins once and store `turnover_alert_fy` / `turnover_alert_level`;
  - the template states the platform-only lower bound;
  - recipients: active admins holding an active role with `grant_all_on_new_subject` (the super-admin role, read from data, not a role code);
  - email template row `admin_franchise_turnover_alert` (file `admin/franchise-turnover-alert.ejs`) is added to migration 145 (`WHERE NOT EXISTS`); a PostgreSQL advisory lock keeps one process per run, as in `invoice-fx.cron.ts`.
- [x] 4.4 Unit tests:
  - FY boundary (31 Mar / 1 Apr, IST);
  - a franchise with a GSTIN shows no warning;
  - amber at 80%, red at 100%;
  - the cron emails once per level;
  - a new FY resets the level;
  - an FX-pending row falls back to `total_amount`.

> **As built (group 4, 2026-10-17):**
> - `FranchiseTurnoverService` (franchise module, raw SQL on the txn tables so it needs no member import): `financialYearRange`, `levelFor`, `forFranchise` / `forFranchiseId`, `turnoverBetween`. The level uses the exact share and only the shown percent is rounded, so ₹39,99,999.99 of ₹40 lakh shows 100.00% but stays amber (found by the tests). Inactive or no-longer-PAID issued rows are counted, as the spec says (issued = `invoice_id` set); for a lower-bound warning that errs early.
> - `GET franchise/:id/turnover` (`Franchise` read; 403 when the caller's `franchiseIds` exclude it, empty = unscoped).
> - `FranchiseTurnoverCron` (`30 9 * * *` IST, advisory lock `franchise-turnover-cron`): sends only when the level rises within the FY, or on a new FY above none; a new FY at none stores the reset silently; a failed send is not stored. `EmailNotificationService.sendEmailFromTemplate` now returns `true` only when the mail reached the transport (existing callers ignore it). Template `templates/admin/franchise-turnover-alert.ejs` + row `admin_franchise_turnover_alert` in 145 (re-applied locally; idempotent).
> - Tests: franchise jest 30/30 (turnover 16, cron 6, franchise save 8; incl. IST 31 Mar 23:59 / 1 Apr 00:00), member 321/321, platform 24/24; both API builds green.
> - Live (local `eatfit`): EFMUM FY 2026-27 ₹1,20,38,018.84, MEMUM ₹79,900 (2% of ₹40 lakh, NONE), HCUAE 2026 AED 92,710 — each equal to a hand-written SQL sum. Locally every franchise still has a GSTIN, so the cron would skip them all; no email was sent. The email renders. Not done: the 403 `curl` (A16), with the group 5 browser session.

## Group 4b: Documents issued, GSTR-1 Table 13 (`server_1` admin-only reports)

- [ ] 4b.1 Pure helper `DocumentSeriesUtil.split(invoiceId)` → `{ seriesKey, sequence }` (trailing digit run). Credit-note detection: type letter `C` in a templated number, or `/CN/` in a legacy one.
- [ ] 4b.2 `DocumentsIssuedService.report(franchiseId, from, to)`:
  - reads plan payments, product orders and credit notes with a number, dated by `invoice_date` (else `payment_date`) in the period;
  - groups by nature of document + `seriesKey`;
  - per row: from / to (min / max sequence), total issued, cancelled (`active = false` or status not PAID), net issued, missing numbers (gap check);
  - marks the whole report "not reported" for a franchise without a GSTIN.
- [ ] 4b.3 `GET reports/documents-issued` + CSV (`@RequireAbility(read, Report)`, franchise-scoped). Contract `IDocumentsIssuedRow` in shared-library.
- [ ] 4b.4 Unit tests:
  - old and new format of one counter give two rows;
  - S / E / P / C split;
  - a cancelled row is counted in issued and in cancelled;
  - a deliberate gap is flagged with the missing number;
  - month vs quarter period;
  - a legacy row with no `invoice_date` uses `payment_date`;
  - another franchise's rows never appear.

## Group 5: Admin CMS (`eatfit247-admin`)

- [ ] 5.1 Franchise form, "Invoice numbering" section:
  - prefix, template, a live preview of the next service / export / product / credit-note numbers with their lengths;
  - validation errors from the shared util;
  - helper text: "Indian GST invoices: at most 16 characters (Rule 46). Changing this does not change issued invoices; the counter continues."
- [ ] 5.2 Franchise form: registration threshold field (₹), shown when there is no GSTIN.
- [ ] 5.3 Franchise list, details and dashboard: a turnover card or badge (amber / red) with "Platform sales only; include any other sales under the same PAN".
- [ ] 5.4 Add-payment and edit-payment form: the remittance hint (decision 10) when the billing country is not India and the selected mode's route is DOMESTIC.
- [ ] 5.5 Reports → "Documents issued (GSTR-1 Table 13)":
  - franchise and period pickers (month / quarter);
  - Material table with columns matching the portal (Nature of document, Sr. No. From, Sr. No. To, Total number, Cancelled, Net issued);
  - a gap warning chip per row;
  - CSV download;
  - a "not a tax invoice" banner for a franchise without a GSTIN.
- [ ] 5.6 Development build green; browser check of the four screens.

## Group 6: Close-out

- [ ] 6.1 All checks in `validation.md` pass.
- [ ] 6.2 Status → Implemented, release pending. Roadmap: 4.7 entry notes the format change and the 138 retirement; 4.11 notes the turnover warning.
- [ ] 6.3 Replanning notes: the mission.md principle 2 exception wording, and the roadmap 4.9 credit notes reuse type `C`.
