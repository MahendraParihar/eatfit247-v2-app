# Plan: Invoice Series and Proforma (roadmap 4.7)

> Source: [requirements.md](./requirements.md) · Done when: [validation.md](./validation.md) passes
>
> **Gate:** 4.5 (checkout and webhook lockdown) is merged. 4.6 is **not** required: this feature ships first (owner, 2026-10-10) and uses the decision 1 interim series rule.
> This feature touches **invoices and migrations**. Implement **one group at a time** and commit between groups. If review finds a gap, add a new group here rather than patching silently.

## Group 1: Shared Library

- [x] 1.1 Add `InvoiceSeriesEnum { DOMESTIC = 'DOMESTIC', EXPORT = 'EXPORT' }` next to the tax enums. Export it from the barrel.
- [x] 1.2 Add `invoiceSeries?` and `invoiceDate?` to the member payment and member product interfaces.
- [x] 1.3 In `core/invoice/invoice.mapper.ts` (payment and product mappers):
  - `invoiceDate` = `invoiceDate ?? paymentDate`.
  - When `invoiceId` is empty: title `PROFORMA INVOICE`, no invoice number, and the note "This is a proforma invoice and not a tax invoice under GST."
- [x] 1.4 Add `blocked: boolean` and `blockReason?: string` to the payment update-preview interface.
- [x] 1.5 Run `cd shared-library && npm run build`, then commit.

> **As built (group 1):**
> - `InvoiceSeriesEnum` is in `enum/tax-type.enum.ts`. `invoiceSeries` / `invoiceDate` (YYYY-MM-DD string) are on `IBasicMemberPayment` and `IBasicMemberProduct`.
> - The mapper sets `header.isProforma` (new optional field on `IInvoiceHeader`), an empty `invoiceNumber` (the old `INV-<id>` fallback is gone) and no QR code for a proforma. `invoice.hbs` hides the "Invoice No" row and labels the date "Date:" on a proforma.
> - Proforma note: "…not a tax invoice under GST." for GST entries; "…not a tax invoice." for others (HCUAE is not under GST). Any existing tax note follows it.
> - `previewUpdate` returns `blocked: false` until group 4.
> - Tests: `server_1/libs/modules/member/src/invoice/invoice-mapper.spec.ts` (5). The platform jest config doesn't map `@eatfit247-shared-lib`, so mapper specs live in the member lib.

## Group 2: Schema migration

- [x] 2.1 `db_changes/137_invoice_series.sql`, in one transaction:
  - `mst_invoice_sequences`:
    - add `series VARCHAR(10) NOT NULL DEFAULT 'DOMESTIC' CHECK (series IN ('DOMESTIC','EXPORT'))`.
    - Look up the real name of the existing `(franchise_id, invoice_type, financial_year)` unique constraint (108 created it inline). Drop it, then add `uq_mst_invoice_sequences_franchise_type_year_series`.
  - `txn_member_payments` and `txn_member_products`: add `invoice_series VARCHAR(10) NULL` (same CHECK) and `invoice_date DATE NULL`.
  - `mst_franchises`: add `time_zone VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata'`, then `UPDATE … SET time_zone='Asia/Dubai' WHERE franchise_code='HCUAE'`.
- [x] 2.2 Update the models to match: `InvoiceSequenceModel`, `TxnMemberPayment`, `TxnMemberProduct`, `MstFranchise`.
- [x] 2.3 Apply locally and check with `\d`. Commit.

> **As built (group 2):** 137 finds the old 3-column unique key by its columns (the generated name was `mst_invoice_sequences_franchise_id_invoice_type_financial_y_key` locally) and replaces it with `uq_mst_invoice_sequences_franchise_type_year_series`. CHECK constraints are named `chk_*_invoice_series` / `chk_mst_invoice_sequences_series`. Applied twice locally without error. Models: `InvoiceSequenceModel.series`, `invoiceSeries` / `invoiceDate` (DATEONLY string) on `TxnMemberPayment` and `TxnMemberProduct`, `MstFranchise.timeZone`. Member jest 161/161.

## Group 3: Backend numbering (`server_1`)

- [x] 3.1 Add a franchise-local date helper (platform lib). It takes a `Date` and an IANA zone and returns `YYYY-MM-DD`, using `Intl.DateTimeFormat` (no new dependency).
- [x] 3.2 `InvoiceSequenceService.generateInvoiceNumber(franchise, invoiceType, series, invoiceDate, trx)`:
  - Take the FY from `invoiceDate`.
  - Use `findOrCreate` with `LOCK.UPDATE`, keyed by series as well.
  - EXPORT numbers format as `{code}/EXP/{fy}/{S|P}/{seq}`.
  - Return `{ invoiceId, invoiceSeries, invoiceDate }` so callers store all three.
- [x] 3.3 Add a pure helper `resolveInvoiceSeries({ franchiseCountryCode, billingCountryCode, taxAmount })` (decision 1 interim rule):
  - EXPORT if the franchise is Indian, the billing country from the stored `member_address` snapshot is not India, and `taxAmount = 0`.
  - DOMESTIC otherwise.
  - Product orders: the order's total tax and its single billing snapshot (so mixed-item series can't happen).
  - Share the country resolution with migration 138 (decision 13) so both give the same answer. 4.6 later swaps the body to the stored tax mode.
- [x] 3.4 Wire the existing issuing paths, each storing `invoice_id`, `invoice_series` and `invoice_date`:
  - plan create (`paymentObj.taxMode`)
  - product create (the items' `taxMode`s)
  - webhook `generateInvoiceForPlan` (`paymentRecord.taxMode`)
  - webhook `generateInvoiceForProduct` (load the items' `taxMode` in the same transaction)
  - **If 4.5 has shipped** (expected), the gateway paths issue invoices inside `PaymentConfirmationService.confirmGatewayPayment`. Wire the series and invoice date there, not in the old webhook helpers.
- [x] 3.5 Webhook and confirmation: derive `payment_date` from the gateway capture timestamp in the franchise's `time_zone`.
- [x] 3.6 Unit tests:
  - service: both series × both types; FY boundary at 31 Mar / 1 Apr in IST and at 31 Dec / 1 Jan for HCUAE; separate counters; lock requested
  - helper: truth table
  - local-date helper: across the UTC/IST midnight
  - `razorpay-webhook.controller.spec.ts`: export plan, export product, domestic plan, replay
- [x] 3.7 `npx nx affected --target=lint,test,build` is green. Commit.

> **As built (group 3):**
> - Platform: `FranchiseDateUtil` (`localDate`, `financialYear`, `calendarDate`) and `InvoiceSeriesUtil` (`resolve`, `snapshotCountry`, `normalize`). `InvoiceSequenceService.generateInvoiceNumber(request, trx)` now takes `{ franchiseId, franchiseCode, fyStartMonth, invoiceType, series, invoiceDate }` and returns `{ invoiceId, invoiceSeries, invoiceDate }`.
> - Member lib: new `InvoiceIssueService` is the **only** code that assigns `invoice_id`. It loads the franchise (code, FY start, `timeZone`) and its country (from its address), resolves the billing country (snapshot code → country id → country name), picks the series and sets `invoiceId` / `invoiceSeries` / `invoiceDate` on the record. Admin plan create, admin product create and `PaymentConfirmationService.confirmGatewayPayment` call it (4.5 removed the old webhook helpers).
> - 3.5: for **plans**, `payment_date` (a `date` column) is the capture day in the franchise's timezone, written as noon UTC so Sequelize formats the same day on any server. Product `payment_date` is a timestamp, so it keeps the capture instant. The gateway invoice date is the capture day in the franchise's timezone.
> - Unknown billing country → DOMESTIC with a warning log.
> - Tests: `invoice/invoice-numbering.spec.ts` (28: date/FY boundaries, series truth table, sequence formats and lock, issue service), `payment-confirmation.service.spec.ts` (+export case, now 26). The webhook spec items in 3.6 are covered by the confirmation spec, since the webhook delegates to it. Member jest 185/185. `nx build admin-api` and `public-api` green.
> - Live (local DB, rolled back): 5128 (US, INR, no tax) → `EFMUM/EXP/2026-27/S/000001`; 5124 (India, GST) → `EFMUM/2026-27/S/000010`; 5126 (HCUAE) → `HCUAE/2026/S/000004`; counters unchanged after rollback.

## Group 4: Issue on PAID and edit guard (`member-plan.service.ts`)

- [x] 4.1 `update`:
  - Inside the existing transaction, if the row has no `invoice_id` and the new status is PAID, issue a number (series from `resolveInvoiceSeries` on the edited draft, date = today in the franchise's zone).
  - Replace the "never generated during edit" comment.
  - Never clear or change an existing `invoice_id`, `invoice_series` or `invoice_date`.
- [x] 4.2 Series guard: if `invoice_series` is set and `resolveInvoiceSeries(draft) !== invoice_series`, throw `BadRequestException` with the message "This invoice is in the {X} series. This change would make it {Y}. Issue a credit note and record a new payment instead."
- [x] 4.3 `previewUpdate`: run the same check and return `blocked` and `blockReason`.
- [x] 4.4 Unit tests:
  - PENDING→PAID issues a number once; saving again issues nothing.
  - PAID→PENDING keeps the number.
  - PAID→PENDING→PAID keeps the first number.
  - A series-changing edit is rejected.
  - A financial edit that keeps the series is allowed.
  - A Q1 legacy row (`invoice_series` NULL) is not guarded.
  - A backdated payment date doesn't change `invoice_date` or the FY.
- [x] 4.5 Commit.

> **As built (group 4):** `update` issues the number through `InvoiceIssueService` when the saved row is PAID and has none (franchise = the payment's `franchise_id`, else the member's). `findSeriesChange` (used by `update` → 400, and by `previewUpdate` → `blocked` / `blockReason`) recomputes the series from the edited billing snapshot and tax; it skips rows without a stored series (Q1 legacy) and gateway records (their billing and amounts are locked by 4.5). `convertToModel` (plans and products) now returns `invoiceSeries` / `invoiceDate`, so the PDF prints the stored invoice date. Tests: `member-plan.invoice-on-paid.spec.ts` (7). Live (local DB): new manual payment 5129 for 4945, PENDING → edit to PAID → `EFMUM/EXP/2026-27/S/000001`, dated 2026-10-10; edit back to PENDING keeps it; PDF renders.

## Group 5: Proforma (backend + admin)

- [x] 5.1 Plan and product `generateInvoicePDF`: no status gate. The mapper renders the proforma; name the file `Proforma-…pdf` when there is no invoice.
- [x] 5.2 `payment-report.service.ts` ZIP export: add `invoice_id IS NOT NULL`. Check the product report export for the same issue.
- [x] 5.3 Admin:
  - `member-payment-history.component.ts` and `member-product-orders.component.ts`: label the action "Download Proforma" when there is no `invoiceId`, otherwise "Download Invoice".
  - `manage-member-payment`: show the preview's `blockReason` and disable Save when it is blocked.
- [x] 5.4 Render check: a proforma, a domestic tax invoice and an export tax invoice. Commit.

> **As built (group 5):** neither PDF method had a status gate. File names: plans `Invoice-<name>-<invoice date>.pdf` / `Proforma-<name>-<paymentId>.pdf`; products `invoice-<id>.pdf` / `proforma-<id>.pdf`. Payment ZIP export and both product ZIP exports (filtered and bulk) only include rows with a non-empty `invoice_id`. Admin: payment-history and product-order rows show "Download Invoice" when there is a number and "Download Proforma" otherwise (two actions with `visible`). The update-preview dialog shows a red "This change can't be saved" section with `blockReason` and disables "Approve & Update" when `blocked`. Render check (local): proforma 5130 → "PROFORMA INVOICE", no number, "Date:", proforma note; export 5129 → `EFMUM/EXP/2026-27/S/000001` (title and "No Tax Applicable" stay until 4.6 stores the export mode); domestic 4744 unchanged.

## Group 5b: Review fixes (groups 1–4)

- [x] 5b.1 `update` locks and re-reads the payment row (`reload` with `LOCK.UPDATE`) inside its transaction before issuing, so two concurrent saves to PAID can't both take a number (a gap).
- [x] 5b.2 Gateway confirmation dates the invoice when it is issued (decision 12), not on the capture day; plan `payment_date` keeps the capture day. A late confirmation after 31 March therefore lands in the new FY.
- [x] 5b.3 The GST QR payload uses the same date as the printed invoice date (plans and products).
- [x] 5b.4 `InvoiceIssueService` logs a warning when the franchise's country can't be resolved (every invoice would fall back to DOMESTIC).
- [x] 5b.5 137 also drops a standalone unique **index** on `(franchise_id, invoice_type, financial_year)` (e.g. from a Sequelize sync), not only the constraint. Tested locally with such an index.
- [x] 5b.6 Not changed: the pool (`max: 5`) concern about extra franchise/country reads during confirmation is the same pattern as before, at a smaller scale; logged for roadmap 5.x. A PAID row without a number (member without a franchise) renders as a proforma, which matches decision 11.
- [x] 5b.7 For 138: JSON `null` snapshots must fall back to the address (`jsonb_typeof(...) = 'object'`), and the country chain is code → id → name, the same as `InvoiceSeriesUtil` / `InvoiceIssueService`.

## Group 6: Data migration (FY 2026-27, Q2 onwards)

- [ ] 6.1 `scripts/invoice-renumber/preview_fy2026_27_q2.sql` (read-only). For every row in the window it outputs:
  - table, pk, franchise_code, type, member name
  - payment_date, active, status
  - billing country (as resolved), `tax_amount`, stored `tax_mode`
  - derived series (decision 13)
  - old invoice_id → new invoice_id

  It must use the same CTEs as 138, copied verbatim.
- [ ] 6.2 `db_changes/138_fy2026_27_q2_invoice_renumber.sql`, in one transaction:
  - **Guards (abort if any fails):**
    - EFMUM and MEMUM exist
    - 137 has been applied
    - every in-window row's billing country can be resolved (abort and list the rows if not)
    - `bkp_138_invoice_renumber` does not exist
  - `LOCK TABLE txn_member_payments, txn_member_products, mst_invoice_sequences IN SHARE ROW EXCLUSIVE MODE`.
  - Capture the Q1 row count and checksum (`md5(string_agg(pk||invoice_id ORDER BY pk))`) per table.
  - **Window:** franchise in (EFMUM, MEMUM), `invoice_id IS NOT NULL`, `invoice_id LIKE <code>/2026-27/%`, `payment_date >= '2026-07-01'`, any `active` value, any status.
  - **Series:**
    - EXPORT when billing country ≠ India **and** `tax_amount = 0`. For products, use the order total `tax_amount`.
    - Otherwise DOMESTIC.
  - **Q1 base per (franchise, type):** the highest trailing 6-digit sequence of FY 2026-27 rows with `payment_date < '2026-07-01'`, or 0 if none.
  - **New numbers:**
    - DOMESTIC = base + `row_number()`; EXPORT = `row_number()`.
    - Partition by (franchise, type, series); order by `payment_date, created_at, pk`.
  - Create `bkp_138_invoice_renumber` (source_table, pk, franchise_id, invoice_type, series, payment_date, billing_country, tax_amount, old_invoice_id, new_invoice_id, migrated_at) and insert the mapping.
  - Phase 1: set `invoice_id = 'TMP138/' || <table> || '/' || pk`.
  - Phase 2: set the final `invoice_id`, `invoice_series`, and `invoice_date = payment_date`.
  - **Counters:**
    - Upsert per (franchise, type, '2026-27', series) to the highest assigned number.
    - DOMESTIC counters with no Q2 rows stay unchanged.
    - Never set a counter below the Q1 base.
  - **Post-asserts (raise if any fails):**
    - each series is contiguous and has no duplicates
    - Q1 count and checksum are unchanged
    - no `TMP138/` values remain
- [ ] 6.3 Header comment with a rollback snippet: restore `invoice_id` from the backup, null out the new columns, restore the counters. Not executed.
- [ ] 6.4 Rehearse on a copy of production:
  1. preview
  2. run 138
  3. run the helper SQL
  4. issue one domestic and one export invoice through the app
  5. re-run 138 and confirm it aborts
- [ ] 6.5 Export the preview to CSV for Accounts' sign-off. Commit.

## Group 7: Release

- [ ] 7.1 PR runbook:
  1. Confirm 4.5 is live (migration 139 applied).
  2. Stop public-api and admin-api.
  3. Apply 137, then 138.
  4. Deploy the server, shared-library and admin builds.
  5. Start the APIs.
  6. Smoke test: one domestic invoice, one export invoice, one proforma.
- [ ] 7.2 Record the go-live timestamp and the counters before and after in `validation.md`.

## Group 8: Close-out

- [ ] 8.1 Every check in `validation.md` passes.
- [ ] 8.2 Set `requirements.md` status to Shipped. Mark roadmap 4.7 ✅ with a link to this folder.
- [ ] 8.3 Replan notes:
  - If the CA agrees, give 4.10 the job of printing the LUT endorsement keyed on `invoice_series` for historical EXP rows.
  - Confirm the 16-character format item stays under "Later".
