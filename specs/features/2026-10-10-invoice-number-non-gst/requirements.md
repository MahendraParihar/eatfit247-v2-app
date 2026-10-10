# Requirements: Invoice Series and Proforma (Separate Export Series for Indian Franchises)

| Field | Value |
|-------|-------|
| Status | **Implemented 2026-10-10, release pending** (ships with 4.5 and 4.6; runbook in [the 4.6 validation](../2026-10-10-tax-engine-correctness/validation.md#release-runbook-45--47--46-ship-together)) |
| Branch | built on `feature/tax-engine-correctness` (stacked on 4.5); PR into `m3-cms-update` |
| Roadmap | Phase 4: **4.7** Invoice series and proforma (was 4.1). **Ships before 4.6** (owner, 2026-10-10: needed for the Q2 FY 2026-27 filing). Until 4.6 ships, new invoices use the billing-country rule of decision 1 |
| References | Accounts department change request (2026-10-10); [mission.md](../../product/mission.md) principles 1, 2, 10, 11; audit findings C2, C3, C6, M1; CGST Act s.13, s.34; CGST Rules 46, 96A; GSTR-1 Table 13 |
| Apps touched | server_1 / shared-library / eatfit247-admin / db_changes |

## Context

The Accounts department needs invoices that an **Indian franchise** (EFMUM "EAT FIT 247", MEMUM "Mahi Enterprise") issues to **customers outside India** to use a **separate invoice series** from domestic GST invoices. These are zero-rated exports under LUT, and GST filings report them separately.

**Current state of the code**

| Area | Today |
|---|---|
| Numbering | `server_1/libs/platform/src/lib/services/invoice-sequence.service.ts`: `{franchiseCode}/{FY}/{S\|P}/{000001}`, one counter per `(franchise_id, invoice_type, financial_year)`. No domestic/export split. |
| Tax mode | **Wrong for foreign customers.** The tax engine's export branch can never run (audit C2), and product tax swaps the supplier and customer (C3). Foreign service clients are stored as `NO_TAX`; foreign product orders as `DOMESTIC_GST`. **4.6 fixes this:** after it ships, new payments store `EXPORT_OF_SERVICE` (services) or the export-of-goods mode (products) for exports. |
| When a number is issued | Only when the payment is already PAID at create time (admin plan create, admin product create, Razorpay webhook). An admin edit from PENDING to PAID issues nothing. |
| Unpaid entries | "Download Invoice" on a PENDING entry renders a "TAX INVOICE" with a blank number. |
| Dates | The PDF prints `payment_date` as the invoice date (`invoice.mapper.ts:87, 436`), but the invoice number's FY comes from the server's `new Date()`. No timezone is configured, so webhook dates come from a UTC timestamp (audit M1). |
| PDFs | Re-rendered on every download, so renumbering needs no file changes. |

**Historical data**
- **Q1 FY 2026-27 (Apr–Jun 2026) is filed.** Its numbers stay unchanged, including foreign clients numbered in the domestic series. Roadmap 4.3 is cancelled.
- From **Q2 (1 Jul 2026)**, issued invoices are renumbered into the two series. Their stored tax mode is unreliable (C2/C3), so historical rows are classified by **what was actually charged and where the customer was** (decision 13).

Tax itself is unchanged by this feature. 4.6 owns tax correctness. Correcting the tax on historical invoices is a CA decision (audit §8 Q7).

## User Stories

- As **Accounts**, I want export invoices numbered in their own series (`EFMUM/EXP/2026-27/S/000001`…), so that domestic and export supplies are separate, continuous series.
- As **Accounts**, I want invoices from Q2 FY 2026-27 onward renumbered into the correct series, with Q1 untouched, so that the open quarter follows the new rule without reopening filed returns.
- As a **finance admin**, I want an invoice number issued automatically the first time a payment becomes PAID (at entry, on edit, or by webhook), so that no paid payment is left without a number.
- As a **finance admin**, I want unpaid entries to download as a **proforma invoice** without a tax-invoice number, so that I can send a payment request without creating a GST liability.

## Scope

**In scope**

*Series*
- A new **series** dimension (DOMESTIC / EXPORT) on `mst_invoice_sequences`, added to the counter key.
- The series is stored on each invoiced row (`invoice_series`).
- For new invoices, the series follows the **same rule as the Q2 renumbering** (decision 1) until 4.6 ships, then the stored tax mode. This covers service and product invoices on every issuing path.
- Export format: `{franchiseCode}/EXP/{FY}/{S|P}/{6-digit seq}`. The domestic format is unchanged.

*When the number is issued*
- The number is issued on the **first transition to PAID**: on create, on an admin plan-payment edit (**new**), or by the webhook.
- Once issued, it is never removed or changed.

*Invoice date and financial year*
- A stored **invoice date** (`invoice_date`) is set at issue, using the franchise's local timezone. The FY in the number comes from this date.
- The PDF prints `invoice_date`.
- Webhook `payment_date` is also derived in the franchise's timezone.

*Edit guard*
- An edit to an invoiced plan payment is rejected if it would move the invoice to the other series. The preview shows the reason.

*Proforma*
- An entry without an invoice number downloads as "PROFORMA INVOICE".
- The admin action label changes to match.
- The ZIP export excludes proformas.

*One-off data migration*
- Scope: FY 2026-27, EFMUM and MEMUM, plans and products, `payment_date >= 2026-07-01`.
- Renumber into the two series, set `invoice_series` and `invoice_date`, back up old→new, and reset the counters.
- A read-only preview runs first, for Accounts to sign off.

**Out of scope**
- **Tax calculation:** owned by 4.6.
- **Correcting tax on historical invoices:** a CA decision.
- **Partner franchises (HCUAE):** they never produce an export mode, so there is no change for them. See [Partner franchises (Dubai)](#partner-franchises-dubai). UAE VAT is roadmap 8.0.
- **Earlier periods:** no renumbering of Q1 FY 2026-27 or any earlier FY.
- **Immutable invoice snapshot and change log:** 4.8. **Credit notes and vouchers:** 4.9. **Printing LUT, place of supply and INR value:** 4.10.
- **The 16-character limit of Rule 46:** the format is kept by owner decision (decision 3). A compliant format is a "Later" roadmap item.
- **Re-sending renumbered invoices to clients.**

## Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **New invoices (until 4.6 ships):** EXPORT when the franchise is Indian, the billing country in the payment's `member_address` snapshot is not India, **and** no tax was charged (`tax_amount = 0`); otherwise DOMESTIC, the same rule as the Q2 renumbering (decision 13). Never decided from currency or a live address lookup. **After 4.6:** 4.6 switches the helper to the stored tax mode (EXPORT for `EXPORT_OF_SERVICE` / `EXPORT_OF_GOODS`), and a foreign client paying INR over Indian payment methods (IGST) then goes to DOMESTIC. | Owner decision 2026-10-10: 4.7 ships first, and until 4.6 every foreign client is stored `NO_TAX`, so the stored mode can't tell exports apart. Using the decision 13 rule keeps new invoices consistent with the renumbered Q2 ones. The snapshot is taken at payment, so this is still a stored value (principle 1). |
| 2 | Numbering only; tax rules belong to 4.6. **This feature ships before 4.6** (owner, 2026-10-10), using the decision 1 interim rule. | The Q2 filing can't wait for 4.6. |
| 3 | Export format `{code}/EXP/{FY}/{S\|P}/{seq}`, e.g. `EFMUM/EXP/2026-27/S/000001` (26 characters). Domestic format unchanged (22 characters). | Owner and Accounts decision: Accounts re-keys numbers into Tally. **Accepted risk:** Rule 46(b) allows 16 characters, so the PDF number differs from the filed number (audit C6). |
| 4 | Add `series` (`DOMESTIC` \| `EXPORT`, default `DOMESTIC`) to `mst_invoice_sequences`, with the unique key `(franchise_id, invoice_type, financial_year, series)`. Add a nullable `invoice_series` column to `txn_member_payments` and `txn_member_products`, set at issue. | Existing counter rows become DOMESTIC with no data change. The stored series lets the edit guard and reports work without parsing `invoice_id` or trusting the (historically wrong) tax mode. |
| 5 | `InvoiceSeriesEnum` lives in `shared-library`. | Principle 8. |
| 6 | Covers services **and** products. Until 4.6, a product order's series uses its single billing snapshot and the order's total tax (decision 1), so items can't disagree. After 4.6, an order is EXPORT only when **all** its items carry the export mode; mixed items fail the issue with a clear error, and no number is consumed. | Items share one billing address, so mixed modes mean a bug. |
| 7 | The counter row for a new series is created on first use (`findOrCreate` under a row lock) and starts at `000001`. | Matches existing behaviour. Accounts confirmed starting at 1. |
| 8 | **The number is issued on the first transition to PAID, and only then.** This covers create-as-PAID, admin plan-payment edit to PAID (**new**), and webhook capture. PENDING and FAILED rows have no number. | GST s.13: the liability arises at the earlier of invoice and payment. Issuing a number at entry would create tax on money never received, and IGST plus interest on unpaid exports after 1 year (Rule 96A). The owner chose this. |
| 9 | **An issued number is permanent.** Later status changes (PAID→PENDING, refund, soft delete) never clear or reissue it. Returning to PAID later does not issue a second number. Nothing is blocked because of status. | GST has no invoice deletion. Cancelled invoices are reported in Table 13, and corrections are made with credit notes (4.9). Principles 2 and 10. |
| 10 | **Edit guard:** on an invoiced plan payment with `invoice_series` set, reject the edit when the series the decision 1 rule gives for the edited draft (billing snapshot + recalculated tax) ≠ `invoice_series`. Q1 legacy rows (`invoice_series` NULL) skip the guard; 4.8 will freeze their financial fields. The preview endpoint reports the block before save. | An invoice can't change series once issued; the correct route is a credit note plus a new invoice. Comparing against the stored series avoids false blocks on historical rows whose stored tax mode was wrong. |
| 11 | **Proforma.** With `invoice_id` empty, the mapper renders the title `PROFORMA INVOICE`, no invoice number, and the note "This is a proforma invoice and not a tax invoice under GST." (for non-GST franchises: "…not a tax invoice.") The admin action is labelled "Download Proforma". The payment-report ZIP export only includes rows with an `invoice_id`. | Today a PENDING entry downloads as a "TAX INVOICE" with a blank number, which is invalid. A proforma creates no tax liability. |
| 12 | **Invoice date.** `invoice_date` (date) is stored at issue as the **local date in the franchise's timezone** (new `mst_franchises.time_zone`, IANA name; default `Asia/Kolkata`, HCUAE `Asia/Dubai`). The FY in the number comes from `invoice_date`, and the PDF prints `invoice_date`. Webhook `payment_date` is derived in the same timezone. A backdated payment does **not** backdate its invoice. | Under GST, the invoice date is the date of issue. This fixes 31 Mar / 1 Apr mismatches (audit M1) and keeps closed-FY series closed without blocking backdated payment entries. |
| 13 | **Migration window:** FY `2026-27`, EFMUM and MEMUM, `payment_date >= 2026-07-01` with no upper bound (includes October rows issued before go-live), both tables, both types. Rows outside the window are never touched. **Historical classification:** EXPORT when the billing country in the `member_address` snapshot (billing address, else address; `countryCode`, else the country name resolved via `mst_countries`) is not India **and** no tax was charged (`tax_amount = 0`). Otherwise DOMESTIC. | The stored tax mode on historical rows is unreliable (C2/C3). The series follows what was actually charged: a foreign order that was charged GST stays DOMESTIC until a CA decides on a correction. |
| 14 | Inside the window, DOMESTIC numbers **continue** from the highest Q1 sequence per (franchise, type), and EXPORT starts at `000001`. Order by `payment_date`, then `created_at`, then the primary key. The migration sets `invoice_date = payment_date` (what the PDF printed) and `invoice_series` for every renumbered row. | Gap-free and continuous with the filed Q1 numbers. |
| 15 | Every in-window row with an `invoice_id` is renumbered, whatever its `active` flag or status (refunded or cancelled included). | An issued number belongs to its series. Cancelled and refunded invoices keep their place (Table 13, credit notes). |
| 16 | Delivered as numbered SQL: `137` (schema) and `138` (data). `138` runs in one transaction with guards, a `bkp_138_invoice_renumber` old→new table, a two-phase update (to avoid clashing with the unique `invoice_id` indexes), counter resets and post-asserts. A read-only preview SQL runs first. | `db_changes` convention. Reviewable, auditable, and reversible from the backup. |
| 17 | `137`, `138` and the code ship together, in a short window with both APIs stopped. 4.6 is **not** required first (decision 2). | No invoice may be issued during renumbering. Razorpay retries webhooks. |

## Research: GST and accounting

This is a summary; see the [audit](../../backlog/2026-10-10-accounting-audit.md) for full sources. It is not legal advice.

- **Rule 46(b):** the number is consecutive, unique per FY, at most 16 characters, and multiple series are allowed. The GSTR-1 upload rejects longer numbers.
- **No invoice deletion under GST.** Cancelled invoices appear in GSTR-1 Table 13. Numbers are never reused.
- **Refunds and reductions** go through a credit note under s.34, referencing the original invoice.
- **A wrong tax type after issue** is fixed with a credit note plus a new invoice, or a GSTR-1 amendment (Table 9A), never by editing the invoice.
- **Time of supply (s.13):** the earlier of the invoice date and the payment date. An invoice issued before payment creates the liability.
- **Exports under LUT (Rule 96A):** if payment isn't received in foreign exchange within 1 year, IGST plus interest becomes due.

## Partner franchises (Dubai)

**Today:** the tax rule is looked up by `(franchise_id, reference_id, buyer country)`.
- A UAE client gets VAT at 5%.
- A non-UAE client gets `NO_TAX` and the title `INVOICE`.
- Both use one series, `HCUAE/{calendar FY}/{S|P}/{seq}`.

**Impact of this feature: none.**
- The EXPORT series is only for Indian franchises (decision 1), so HCUAE never gets one.
- HCUAE keeps a single DOMESTIC series, and migration 138 excludes it.
- The new `invoice_date` uses `Asia/Dubai` for HCUAE.

**Is one series legal in the UAE?** Yes. UAE VAT (Executive Regulation Art. 59) needs a unique, sequential number, with no character limit and no separate-series rule. Zero-rated sales are reported separately in the VAT return.

**Gaps found here are owned by roadmap 8.0:**
- zero-rating for non-UAE clients instead of `NO_TAX`
- a "Tax Invoice" title with the TRN
- AED amounts
- tax credit notes
- e-invoicing readiness for 1 Jul 2027

**Built to extend.** `resolveInvoiceSeries` is the only place that decides the series. 4.6 swaps its body from the interim billing-country rule to the stored tax mode, with no schema change.

## Technical Constraints

- **Data:**
  - `db_changes/137_invoice_series.sql`:
    - add `mst_invoice_sequences.series` (CHECK, default DOMESTIC) and swap the unique key
    - add `txn_member_payments.invoice_series` and `invoice_date`, and the same two columns on `txn_member_products`
    - add `mst_franchises.time_zone` (`VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata'`), and set it to `'Asia/Dubai'` for `HCUAE`
  - `db_changes/138_fy2026_27_q2_invoice_renumber.sql`: the one-off data migration (decisions 13–16).
  - Preview: `scripts/invoice-renumber/preview_fy2026_27_q2.sql`, read-only.
  - Resolve franchises by `franchise_code`, never by hard-coded ids.
- **Contract:**
  - `InvoiceSeriesEnum`.
  - `invoiceSeries` and `invoiceDate` on the payment and product interfaces.
  - Proforma behaviour in the invoice mapper.
  - A preview block field (`blocked`, `blockReason`).
- **API:**
  - No new endpoints.
  - The plan-payment `update` can return 400 from the series guard.
  - Invoice download returns a proforma for rows without an invoice.
- **RBAC:** no change.
- **Money:**
  - One helper decides the series (the decision 1 rule now; the stored tax mode after 4.6).
  - `generateInvoiceNumber` takes the series and the invoice date, and runs in the caller's transaction with `LOCK.UPDATE`.
  - A number is issued only when `invoice_id` is empty.
- **Async:** both webhook paths use the same helper. The webhook row lock and forward-only status rules come from 4.5.

## Principle Check

| Principle | Status |
|-----------|--------|
| 1 Tax at payment | ✅ The series comes from values stored at payment: the billing snapshot and the tax charged (the stored tax mode after 4.6). Historical rows use the same rule. |
| 2 No invoice gaps | ✅ Gap-free counters per franchise, type, FY and series. Numbers are issued on PAID and never removed. **Exception:** Q1 FY 2026-27 stays as filed. |
| 3 Franchise isolation | ✅ Counters are per franchise. |
| 6 Soft delete only | ✅ Nothing is deleted. The backup table is kept. |
| 7 Ordered journey | ✅ The invoice strictly follows payment. |
| 8 One contract | ✅ Enum, interfaces and mapper live in shared-library. |
| 9 Automated proof | ⚠️ Unit tests only; integration tests come with roadmap 5.3. |
| 10 Issued invoices are immutable | ⚠️ Partial. The number and series are fixed. Freezing financial fields is 4.8. |
| 11 Server owns money state | ✅ Relies on 4.5 (only the gateway or an admin moves a payment to PAID). |
| 4, 5 | N/A |

## Risks

- **Rule 46 length (accepted).** The number on the PDF differs from the number Accounts files. An auditor may query this; the penalty under s.125 is up to ₹25,000.
- **Historical tax stays as issued.** Q2 foreign service invoices now in the EXP series were issued as "No Tax Applicable", without LUT wording. Foreign product orders that were charged GST stay DOMESTIC. Corrections await the CA (audit §8 Q7). 4.10 can print the LUT endorsement keyed on `invoice_series` if the CA agrees.
- **No credit notes until 4.9.**

## Open Questions

- [ ] **Before the migration:** run the `tax_mode` and billing-country counts on production to size the EXP set (audit §6 queries). Accounts signs off the preview.
- [ ] Accounts or a CA to confirm decision 15: refunded or inactive Q2 rows keep their (renumbered) place in the series.
- [ ] Wording of the proforma note, and any extra fields Accounts wants on it (validity date, bank details).
- [ ] Dubai Accounts: TRN status, and whether they want a separate zero-rated series. This feeds 8.0 and doesn't block 4.7.
