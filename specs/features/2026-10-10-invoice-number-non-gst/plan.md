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

- [ ] 2.1 `db_changes/137_invoice_series.sql`, in one transaction:
  - `mst_invoice_sequences`:
    - add `series VARCHAR(10) NOT NULL DEFAULT 'DOMESTIC' CHECK (series IN ('DOMESTIC','EXPORT'))`.
    - Look up the real name of the existing `(franchise_id, invoice_type, financial_year)` unique constraint (108 created it inline). Drop it, then add `uq_mst_invoice_sequences_franchise_type_year_series`.
  - `txn_member_payments` and `txn_member_products`: add `invoice_series VARCHAR(10) NULL` (same CHECK) and `invoice_date DATE NULL`.
  - `mst_franchises`: add `time_zone VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata'`, then `UPDATE … SET time_zone='Asia/Dubai' WHERE franchise_code='HCUAE'`.
- [ ] 2.2 Update the models to match: `InvoiceSequenceModel`, `TxnMemberPayment`, `TxnMemberProduct`, `MstFranchise`.
- [ ] 2.3 Apply locally and check with `\d`. Commit.

## Group 3: Backend numbering (`server_1`)

- [ ] 3.1 Add a franchise-local date helper (platform lib). It takes a `Date` and an IANA zone and returns `YYYY-MM-DD`, using `Intl.DateTimeFormat` (no new dependency).
- [ ] 3.2 `InvoiceSequenceService.generateInvoiceNumber(franchise, invoiceType, series, invoiceDate, trx)`:
  - Take the FY from `invoiceDate`.
  - Use `findOrCreate` with `LOCK.UPDATE`, keyed by series as well.
  - EXPORT numbers format as `{code}/EXP/{fy}/{S|P}/{seq}`.
  - Return `{ invoiceId, invoiceSeries, invoiceDate }` so callers store all three.
- [ ] 3.3 Add a pure helper `resolveInvoiceSeries({ franchiseCountryCode, billingCountryCode, taxAmount })` (decision 1 interim rule):
  - EXPORT if the franchise is Indian, the billing country from the stored `member_address` snapshot is not India, and `taxAmount = 0`.
  - DOMESTIC otherwise.
  - Product orders: the order's total tax and its single billing snapshot (so mixed-item series can't happen).
  - Share the country resolution with migration 138 (decision 13) so both give the same answer. 4.6 later swaps the body to the stored tax mode.
- [ ] 3.4 Wire the existing issuing paths, each storing `invoice_id`, `invoice_series` and `invoice_date`:
  - plan create (`paymentObj.taxMode`)
  - product create (the items' `taxMode`s)
  - webhook `generateInvoiceForPlan` (`paymentRecord.taxMode`)
  - webhook `generateInvoiceForProduct` (load the items' `taxMode` in the same transaction)
  - **If 4.5 has shipped** (expected), the gateway paths issue invoices inside `PaymentConfirmationService.confirmGatewayPayment`. Wire the series and invoice date there, not in the old webhook helpers.
- [ ] 3.5 Webhook and confirmation: derive `payment_date` from the gateway capture timestamp in the franchise's `time_zone`.
- [ ] 3.6 Unit tests:
  - service: both series × both types; FY boundary at 31 Mar / 1 Apr in IST and at 31 Dec / 1 Jan for HCUAE; separate counters; lock requested
  - helper: truth table
  - local-date helper: across the UTC/IST midnight
  - `razorpay-webhook.controller.spec.ts`: export plan, export product, domestic plan, replay
- [ ] 3.7 `npx nx affected --target=lint,test,build` is green. Commit.

## Group 4: Issue on PAID and edit guard (`member-plan.service.ts`)

- [ ] 4.1 `update`:
  - Inside the existing transaction, if the row has no `invoice_id` and the new status is PAID, issue a number (series from `resolveInvoiceSeries` on the edited draft, date = today in the franchise's zone).
  - Replace the "never generated during edit" comment.
  - Never clear or change an existing `invoice_id`, `invoice_series` or `invoice_date`.
- [ ] 4.2 Series guard: if `invoice_series` is set and `resolveInvoiceSeries(draft) !== invoice_series`, throw `BadRequestException` with the message "This invoice is in the {X} series. This change would make it {Y}. Issue a credit note and record a new payment instead."
- [ ] 4.3 `previewUpdate`: run the same check and return `blocked` and `blockReason`.
- [ ] 4.4 Unit tests:
  - PENDING→PAID issues a number once; saving again issues nothing.
  - PAID→PENDING keeps the number.
  - PAID→PENDING→PAID keeps the first number.
  - A series-changing edit is rejected.
  - A financial edit that keeps the series is allowed.
  - A Q1 legacy row (`invoice_series` NULL) is not guarded.
  - A backdated payment date doesn't change `invoice_date` or the FY.
- [ ] 4.5 Commit.

## Group 5: Proforma (backend + admin)

- [ ] 5.1 Plan and product `generateInvoicePDF`: no status gate. The mapper renders the proforma; name the file `Proforma-…pdf` when there is no invoice.
- [ ] 5.2 `payment-report.service.ts` ZIP export: add `invoice_id IS NOT NULL`. Check the product report export for the same issue.
- [ ] 5.3 Admin:
  - `member-payment-history.component.ts` and `member-product-orders.component.ts`: label the action "Download Proforma" when there is no `invoiceId`, otherwise "Download Invoice".
  - `manage-member-payment`: show the preview's `blockReason` and disable Save when it is blocked.
- [ ] 5.4 Render check: a proforma, a domestic tax invoice and an export tax invoice. Commit.

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
