# Requirements: Workshop Invoices

| Field | Value |
|-------|-------|
| Status | Code complete, awaiting production rollout (2026-10-26). Set to Shipped after the renumbering run. |
| Branch | `feature/workship-invoice`, branched from `m3-cms-update` (owner decision: not stacked on 4.5–4.14) |
| Roadmap | Phase 4: new item **4.15 Workshop invoices** (added at close-out; 4.5–4.14 are taken on `feature/configurable-tax-treatment`) |
| References | Request from Foram Nayak (Accounts), 25 Oct 2026; [mission.md § Product Principles](../../product/mission.md#product-principles) |
| Apps touched | db_changes / shared-library / server_1 / eatfit247-admin |

## Context

EatFit247 (franchise EFMUM) ran a **"Gut reset programme workshop"** on **11 Aug 2026** with **574 participants**. One organiser paid for everyone. The organiser has **no GSTIN**, so this is B2C, and the organiser's State decides CGST+SGST vs IGST. Accounts asked for three invoices:

| Invoice | Participants | Basic | GST 18% | Total |
|---------|--------------|-------|---------|-------|
| 1 | 200 × ₹850 | ₹170,000 | ₹30,600 | ₹200,600 |
| 2 | 200 × ₹850 | ₹170,000 | ₹30,600 | ₹200,600 |
| 3 | 174 × ₹850 | ₹147,900 | ₹26,622 | **₹174,522** |

Accounts' note gave ₹174,523 for invoice 3. The owner confirmed that was a typo; ₹174,522 is correct.

**The three invoices must be dated 11 Aug 2026 and sit in the series where 11 Aug falls** (owner, 26 Oct 2026). EFMUM's FY 2026-27 S series has kept running since then. On the local production copy (refreshed 17 Oct), the highest-numbered invoice dated on or before 11 Aug is `EFMUM/2026-27/S/000351`, and 140 invoices follow it (000352–000491, dated 12 Aug–25 Oct). Placing the three invoices at 352–354 means moving every later number up by 3, once, on production. The owner confirmed GSTR-1 is **not filed** for any month from Aug 2026 onward, so these numbers can still change. The series is already slightly out of date order (for example, 000335 is dated 12 Aug and 000336 is dated 11 Aug); the cut-off is defined by number, not by date order.

The organiser's legal name, address and State aren't part of this spec. The admin enters them, with valid details, when creating each invoice; the system only provides and validates the fields. Examples in this spec use placeholders: `<Organiser legal name>`, `<Address line 1>`, `<City>`, `<State>`, `<Pincode>`.

On `m3-cms-update` the platform can't produce these invoices. Every service invoice is a member payment (`txn_member_payments`) that:

- needs a member and a program plan,
- prints qty 1 and the hardcoded description "Nutrition & Diet Counseling Services" (`member-plan.service.ts` `buildInvoiceItems`),
- takes its amount from the plan fee,
- updates the member's diet-plan limits.

Workshops and corporate sessions are a different kind of sale: one payer, many attendees, free description, qty × rate. They need their own invoice document. It must still use the same tax engine, the same gap-free numbering and the same PDF template.

## User Stories

- As a **Financial Manager**, I want to raise a tax invoice for a workshop with a bill-to party, description, participant count and per-head rate, so that the organiser gets a correct GST invoice without creating a fake member.
- As a **Financial Manager**, I want the invoice number to continue the franchise's service (S) series, so that Accounts/Tally and GSTR-1 see one gap-free series.
- As a **Financial Manager**, I want to set the invoice date and the date of supply separately, so that I can follow whatever the CA decides about workshops invoiced after the event.
- As a **Super Admin**, I want workshop invoices scoped to franchises, so that a partner franchise never sees EatFit247 India's invoices.

## Scope

**In scope**
- New transactional table for workshop invoices, one invoice line per row (description, quantity, unit rate; the SAC is the same as production's, see decision 9).
- Bill-to party entered by the admin (decision 13): legal name, address (country, State, city, lines, pincode), optional contact person, GSTIN, email and phone, plus a place-of-supply State (defaults to the bill-to State).
- Tax from the existing `TaxEngineService` for a SERVICE sale. It is calculated and stored when the invoice is saved (tax at payment).
- Payment status, mode, reference and date with the **same statuses and rules as member payments**. The invoice number is issued on the first move to PAID.
- Invoice number from `InvoiceSequenceService`, shared with member service invoices (same franchise, type `SERVICE` and FY counter).
- Invoice date chosen by the admin (default today, franchise-local). FY and counter come from the invoice date.
- PDF from the existing universal template (`templates/invoice.hbs`), built through a shared-library mapper and streamed to the admin. It isn't written to public `media-files/`.
- Cancel (soft delete) that keeps the number. Nothing is ever physically deleted.
- Admin screen: list (filters: franchise, invoice date range, status, search), create/edit form with a live tax preview, PDF download and cancel.
- RBAC subject `WorkshopInvoice` (franchise-scoped) for Super Admin (automatic) and Financial Manager (seeded).
- **One-off production renumbering script** that puts the three workshop invoices right after the last invoice dated on or before 11 Aug 2026, moves every later EFMUM FY 2026-27 S number up by 3, and logs every change (decisions 14–16).

**Out of scope**
- Emailing the invoice to the organiser. The admin downloads and sends it.
- Attendee names or uploaded lists. Only the participant count is stored, as the quantity.
- Several lines per invoice. One line per invoice covers the request; add multi-line later if needed.
- Credit notes or refunds for workshop invoices (roadmap 4.9). REFUND is only a status, as on member payments.
- Workshop invoices in the existing payment reports or an Excel export (see Open Questions).
- Customer-GSTIN B2B tax logic (place of supply from the GSTIN State) is part of 4.14 and doesn't exist on this base. The GSTIN is stored and printed only.
- Public website and online payment. The website is down; workshop invoices are admin-entered only.
- A general "insert an invoice at a past position" feature in the admin. Renumbering is a one-off script for these three invoices only; any later workshop invoice takes the next number.
- Re-sending corrected PDFs to clients whose invoice numbers change. Accounts decides that; the script gives them the old → new list.

## Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | Workshop invoices get their **own table** `txn_workshop_invoices`, not extra columns on `txn_member_payments`. | A workshop has no member or plan, and member payments drive diet-plan limits. A fake member would pollute member data and reports. |
| 2 | Numbers come from the **same S series** as member service invoices (`InvoiceSequenceService.generateInvoiceNumber`, `BusinessTypeEnum.SERVICE`). | One gap-free service series per franchise and FY. Accounts/Tally and GSTR-1 Table 13 see nothing new. |
| 3 | **FY and counter come from the invoice date**, not from the server clock. Workshop issuance passes the date to `generateInvoiceNumber`. The member path keeps today's behaviour (no date passed, so it uses today). | The base service uses `new Date()` for the FY. That is wrong for a backdated invoice near a FY boundary, and it must not change member invoices in this feature. |
| 4 | **Invoice date** defaults to today (franchise-local) and may be set in the past. A future date, or a date in an earlier FY than today's, is refused. A date earlier than the latest invoice date already issued in the franchise's S series for that FY needs an explicit confirmation, and the warning names that date. **Date of supply** (workshop date) is stored separately and printed on the PDF. | Keeps the system usable for future workshops invoiced after the event. Closed FYs (GST filed) are never touched. The three 11 Aug invoices don't go through this path; they get their numbers from the renumbering script (decision 14). |
| 5 | **Tax** is calculated by `TaxEngineService.calculate` with base = quantity × unit rate, no discount, supplier = the franchise address, customer = bill-to country and **place-of-supply State**, `transactionType: SERVICE`, `referenceId: 1` (same as member payments). Tax is exclusive (₹850 + 18%). Amounts are rounded to 2 decimals on the line total, not per head. The full tax result (`tax_obj`, type, mode, %, LUT flag, jurisdiction) is stored on the row. | Tax at payment (principle 1). The rule comes from Tax Master as it does today, so no rate is hardcoded. Rounding the line total gives exactly ₹26,622 for invoice 3. |
| 6 | The **place-of-supply State** is its own field and defaults to the bill-to State. | For an event, GST place of supply may be where it's held (IGST Act s.12(5)/(7)) rather than where the organiser is. The admin can follow the CA without a code change. |
| 7 | **Payment status works like member payments**: PAID, PENDING, FAILED or REFUND, with mode, reference and payment date. The number is issued once, on the first move to PAID, and never removed. Before PAID, a row has no number and no PDF. | Owner: "same as member payments". |
| 8 | **After a number is issued, the money fields are locked**: franchise, quantity, rate, description, currency, bill-to country and State, place of supply, invoice date and supply date. The bill-to name, address lines, email, phone, GSTIN text, notes and payment reference/mode/date can still be edited. **Cancel** sets `active = false` with a reason, keeps the number and stamps the PDF "CANCELLED". | No invoice gaps (principle 2). An issued invoice's tax values never change. Soft delete only (principle 6). |
| 9 | The **SAC is the same as production**: `ConfigParam.DIET_SAC_CODE`, as member invoices use. It isn't shown as an input or editable. The value is copied to the row when the number is issued, so a later config change can't alter an issued invoice. | Owner: keep the production SAC, no change for now. |
| 10 | The RBAC subject `WorkshopInvoice` has `franchise_scoped = true`. The trigger grants it to Super Admin, and the migration seeds all four actions for `financial_manager`. Delete = Cancel. Every query is scoped to the admin's franchises **and** checked by CASL with the row's `franchiseId`. | Permissions live in data (principle 5) and franchise isolation (principle 3). |
| 11 | The PDF is generated on demand and returned as `IFileModel` (base64) from admin-api. It isn't written under public `media-files/`. | Invoices carry customer data and must not be served publicly. |
| 12 | The PDF's terms are workshop-specific: they leave out the member-program lines ("valid only for the registered individual", "pause up to 20 days") and keep the advisory-nature, non-refundable and franchise-terms lines. | The member terms don't fit a group workshop. |
| 13 | **The admin enters the bill-to details; the system validates them.** Required: legal name, address line 1, city, country, State and pincode (6 digits for India). Optional: contact person, address line 2, email (format check), phone and GSTIN (15-character format check when given; stored and printed only). Nothing about the organiser is seeded or hardcoded. | Owner: the admin creates the invoice with all valid details; the system only provides the fields. |
| 14 | **One-off renumbering for the three 11 Aug invoices.** The admin first creates the three workshop invoices in the UI as **PENDING**, with invoice date and supply date 11 Aug 2026 and all bill-to and payment details filled. Then a script, given those three IDs in order:<br>1. locks the EFMUM SERVICE FY 2026-27 counter row (this blocks new invoice numbers until it commits);<br>2. finds **N** = the highest number in the series whose invoice is dated on or before 11 Aug 2026 (member payments by `payment_date`, workshop invoices by `invoice_date`);<br>3. moves every number above N up by 3, in both tables;<br>4. gives the three workshop invoices N+1, N+2 and N+3 and sets them PAID;<br>5. adds 3 to the counter.<br>Everything runs in one transaction. Only `invoice_id` changes; dates, amounts and tax stay as they are. | Owner: the three invoices must sit at 11 Aug. Using the normal PENDING → number flow would issue the next number instead. Creating them in the UI first reuses the feature's validation and tax calculation. |
| 15 | **The script is safe by default.** It runs as a dry run unless `--apply` is passed. It prints N, the three new numbers and the full old → new list, and writes a CSV. It refuses to run when: the series has a gap or a duplicate (1…counter); any of the three invoices is missing, inactive, not PENDING, not on the given franchise, not dated 11 Aug, or lacks payment details; or the same invoices were already renumbered (checked in the log). Any error rolls back the whole run. Moving numbers goes through a temporary value so the unique index on `invoice_id` never clashes. | A production change to issued invoices must be repeatable in a dry run, approved before it runs, and impossible to apply twice. |
| 16 | **Every change is logged** in a new `txn_invoice_renumber_log` table: run ID, table, row ID, old and new invoice number, reason, plus the audit columns. Rows are never deleted. | Audit trail for Accounts, Tally corrections and the CA, since issued numbers are changing. |

## Technical Constraints

- **Data:** migration `db_changes/151_workshop_invoices.sql`. **151 is the next free number across all branches**: 137–149 are used on the tax branches and 150 is reserved by 4.14.
  - `txn_workshop_invoices`:
    - `franchise_id` FK; `invoice_id` unique nullable; `invoice_date`; `supply_date`.
    - Bill-to: name, contact person, email, phone, GSTIN, address JSON snapshot (`IAddress` shape), `bill_to_country_id` / `bill_to_state_id`, `place_of_supply_state_id`.
    - Line: `description`, `sac_code`, `quantity` (> 0), `unit_rate`.
    - Amounts and tax: `order_amount`, `discount_amount`, `tax_amount`, `total_amount`, `currency`, `tax_obj`, `tax_type`, `tax_mode`, `tax_percentage`, `is_lut_applied`, `jurisdiction`.
    - Payment: `payment_status_id`, `payment_mode_id`, `transaction_id`, `payment_date`.
    - Notes and cancel: `notes`, `cancel_reason`, `active`.
    - The standard audit columns.
  - `txn_invoice_renumber_log` (decision 16).
  - The same migration adds the RBAC subject and seeds the Financial Manager permissions.
- **Renumbering script:** a TypeScript script in `server_1` (never `.js`), run with ts-node against the target DB. It works on the production schema (migration 136 + 151): service invoice numbers live only in `txn_member_payments.invoice_id` and `txn_workshop_invoices.invoice_id`, there is one S counter per franchise and FY, and the format is `{franchiseCode}/{FY}/S/{6 digits}`. Product (P) invoices aren't touched. Member invoice PDFs are generated on each download, so they pick up the new numbers automatically.
- **Contract:** shared-library gets `IWorkshopInvoice`, the list/search interfaces and the `WorkshopInvoice` value in `AdminSubjectEnum`, plus a `mapWorkshopInvoiceToInvoiceDocument` mapper next to `mapPaymentToInvoiceDocument` in `core/invoice/invoice.mapper.ts`.
- **API (admin-api only):** list, get, tax preview, create, update, cancel and PDF under `workshop-invoice`, with `IResponse<T>` and `@RequireAbility(…, AdminSubjectEnum.WorkshopInvoice)`. Validation uses class-validator DTOs.
- **Backend placement:** a new feature domain under `libs/modules/workshop-invoice`, scaffolded with `npx nx g feature-module`. It depends on `tax-engine`, the platform `InvoiceSequenceService`, `InvoicePdfService` and the franchise and address services. It must not depend on `libs/modules/member`.
- **Admin placement:** a new feature lib `libs/admin/workshop-invoices` (standalone components + `inject()` where the lib allows, Material, `var(--mat-*)` tokens). The menu item is hidden without Read.
- **Money:**
  - Issuing a number runs in the same transaction as the PAID save, under the row lock `generateInvoiceNumber` already takes. A failed save never uses up a number.
  - The workshop and member paths share one counter row.
- **Merge-forward:** when 4.5–4.14 (`feature/configurable-tax-treatment`) merges into `m3-cms-update`, workshop issuance must move to `InvoiceIssueService`. That brings the `invoice_date` column, the series, the ≤16-character `EFM/2627/S/…` format and the missing counter → 409. The B2B/GSTIN tax path must be adopted too. The roadmap row records this as a follow-up. Run the renumbering **before** 4.5–4.14's migrations reach production: migration 145 continues from the counter's value at that time, which already includes the +3.

## Principle Check

| Principle | Status |
|-----------|--------|
| 1 Tax at payment | ✅ Tax is computed by the engine on save and stored; the PDF renders stored values only. |
| 2 No invoice gaps | ✅ Shared S counter, number only on PAID inside the save transaction, never removed; cancel keeps the number. The renumbering script checks there are no gaps or duplicates before and after. ⚠️ A backdated invoice date makes the dates non-monotonic within the series. It is allowed only with a confirmation and only within the current FY (decision 4). ⚠️ **Exception: issued invoice numbers change.** This reverses the 17 Oct 2026 decision that issued invoices are never changed (the reason migration 138 was retired). The owner approved it on 26 Oct 2026, on condition that GSTR-1 is unfiled from Aug 2026 onward. It is limited to one logged, dry-run-first script run (decisions 14–16). |
| 3 Franchise isolation | ✅ The franchise-scoped subject, service-level filtering and the CASL check use the row's franchise. |
| 4 Nutritionists cross franchises | n/a (no nutritionist access). |
| 5 Permissions live in data | ✅ Seeded in the migration; no role checks in code. |
| 6 Soft delete only | ✅ Cancel = `active = false`. |
| 7 Ordered journey | n/a (no member journey). |
| 8 One contract | ✅ Interfaces and the mapper live in shared-library. |
| 9 Automated proof | ⚠️ Partial. Jest unit tests cover amounts, the date/FY rules, locking and scoping. Endpoint integration and e2e tests wait for the 5.3 / 5.4 harnesses and are listed in validation.md. |

## Open Questions

- [ ] **CA:** what is the place of supply for the workshop: the organiser's State or the venue's State (s.12(5)/(7))? Was it held online?
- [ ] **Accounts:** do workshop invoices need to appear in the existing payment report / Excel export for Tally re-keying, or is the workshop list screen enough?
