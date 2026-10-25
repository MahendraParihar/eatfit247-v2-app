# Plan: Workshop Invoices

> Source: [requirements.md](./requirements.md) · Done when: [validation.md](./validation.md) passes
>
> This feature touches invoices, tax, RBAC and a migration, so implement **one group at a time** and commit between groups. After each group: run its own gate, re-run every earlier group's gate, then review. Review fixes go in an "Nb" group, not silent patches.

## Group 1: Database

- [x] 1.1 `db_changes/151_workshop_invoices.sql` (one transaction, idempotent):
  - `txn_workshop_invoices` with the columns in requirements § Technical Constraints.
  - FKs to franchise, country, state, payment status and payment mode.
  - `UNIQUE (invoice_id)` (nullable); `CHECK (quantity > 0)` and `CHECK (unit_rate >= 0)`.
  - Indexes on `(franchise_id, invoice_date)` and `payment_status_id`.
  - The standard audit columns and `active` default true.
  - `txn_invoice_renumber_log` (run ID, table, row ID, old and new invoice number, reason, audit columns; decision 16).
- [x] 1.2 In the same file:
  - Insert the `WorkshopInvoice` subject into `mst_admin_subjects` with `franchise_scoped = true` and `ON CONFLICT DO NOTHING`. The trigger grants it to Super Admin.
  - Seed all four actions for `financial_manager`, following the 119 pattern.
- [x] 1.3 Apply the migration to the local DB and re-run it to prove it is idempotent.
- **Gate:** the migration applies twice without error, `\d txn_workshop_invoices` matches the spec, and the permission rows exist for roles 1 and 7.
- **As built:** money columns are `NUMERIC(12,2)` (member payments use 10,2; a 574-seat invoice still fits either). `sac_code` stays NULL until the number is issued (decision 9). The log has `old_invoice_id` nullable (a workshop invoice has no number before the script). Applied to the local walk-through DB `eatfit_wi` (clone of `eatfit_rh145`, the 14 Oct production copy, with the tax-branch `series` column dropped and the 136 unique key restored, so `mst_invoice_sequences` matches production).

## Group 2: Shared Library

- [x] 2.1 `IWorkshopInvoice`, the create/update/search/cancel/preview interfaces, and `AdminSubjectEnum.WorkshopInvoice`.
- [x] 2.2 `mapWorkshopInvoiceToInvoiceDocument` in `core/invoice/invoice.mapper.ts`:
  - one line (description, SAC, qty, unit rate and stored tax rows);
  - invoice date, plus the date of supply in the document's notes/particulars;
  - bill-to name, address and GSTIN;
  - a cancelled flag.
- [x] 2.3 Extend `invoice.hbs` only where needed: a date-of-supply line and a CANCELLED stamp. Member invoices must render unchanged.
- **Gate:** `cd shared-library && npm run build`, and existing invoice PDFs render the same for one domestic and one export member payment.
- **As built:** `workshop-invoice.interface.ts` holds `IWorkshopInvoice`, `IManageWorkshopInvoice`, `IWorkshopInvoiceTaxRequest`, `IWorkshopInvoiceSearch`, `ICancelWorkshopInvoice`, `IWorkshopInvoiceMasterData`, the bill-to snapshot `IWorkshopInvoiceAddress` and `WORKSHOP_INVOICE_LOCKED_FIELDS` (decision 8). `IInvoiceHeader` gains optional `supplyDate`, `placeOfSupply` and `cancelled`; `IInvoiceParty` gains optional `contactPerson`; `IInvoiceDocument` gains optional `notes` (the template already read `invoice.notes`). The template's dead `playOfSupply` block (never set, and wrongly date-formatted) became the Date of Supply and Place of Supply lines. The CANCELLED stamp is styled inline inside its `{{#if}}` so member HTML stays byte-identical. `buildBuyerInfo` now takes the address fields it prints (`IAddress` still fits).

## Group 3: Invoice numbering by invoice date (money)

- [ ] 3.1 `InvoiceSequenceService.generateInvoiceNumber` gets an optional `invoiceDate`. The FY comes from it when it is given, otherwise from `new Date()`. Every existing caller stays unchanged.
- [ ] 3.2 Unit tests:
  - FY from the date on both sides of a 1 April boundary, and on a January-FY franchise.
  - The default stays today.
  - Two issues in a row give consecutive numbers on the same counter row.
- **Gate:** the new spec passes, and member, product and webhook invoice behaviour is unchanged (existing specs and a grep of the callers).

## Group 4: Backend domain (`libs/modules/workshop-invoice`)

- [ ] 4.1 Scaffold with `npx nx g feature-module`: model (snake_case → camelCase) and repository.
- [ ] 4.2 Service:
  - **Preview:** quantity × rate is passed to `TaxEngineService.calculate`, with the supplier from the franchise address and the customer from the bill-to country plus the place-of-supply State.
  - **Create and update:** recalculate and store the tax result (decision 5).
  - **Number on PAID:** issue the number on the first move to PAID, inside the transaction, passing `invoiceDate` (decisions 2, 3, 7).
  - **Invoice-date rules:** no future date; no earlier FY; an earlier date than the series' latest needs confirmation, checked against member payments' `payment_date` for issued S invoices and workshop `invoice_date` in the same franchise and FY (decision 4).
  - **Bill-to validation:** required fields, India pincode, email and GSTIN format in the DTOs (decision 13).
  - **SAC:** read `ConfigParam.DIET_SAC_CODE` and copy it to the row when the number is issued (decision 9).
  - **Lock and cancel:** money fields locked after issue; cancel with a reason (decision 8).
  - **Franchise scoping:** every read and write is filtered to the admin's franchises.
- [ ] 4.3 Unit tests:
  - 200 × 850 = ₹200,600 and 174 × 850 = ₹174,522, for both CGST+SGST and IGST.
  - The number is issued only on PAID, and once.
  - A rollback leaves the counter unchanged.
  - Each date rule.
  - Missing required bill-to fields and a bad pincode, email or GSTIN are rejected.
  - The SAC on the row equals the config value at issue.
  - Locked fields are rejected after issue and allowed before.
  - Cancel keeps the number.
  - Another franchise's row gets 404/403.
- **Gate:** `npx nx test workshop-invoice` and `npx nx affected --target=lint,build`.

## Group 5: Admin API, RBAC and PDF

- [ ] 5.1 Controller in admin-api:
  - `GET workshop-invoice` (list/search) and `GET :id`;
  - `POST calculate-tax`, `POST` and `PUT :id`;
  - `PUT :id/cancel` and `GET :id/invoice` (PDF).
  - Each endpoint has `@RequireAbility` (Read/Create/Update/Delete on `WorkshopInvoice`) plus a CASL check with the row's `franchiseId`.
- [ ] 5.2 PDF through `InvoicePdfService` with the workshop terms (decision 12), returned as `IFileModel` and not written to `media-files/` (decision 11). A row without a number returns 400.
- [ ] 5.3 Register the module in admin-api only.
- **Gate:** curl the happy path and one failure per endpoint (validation A1–A12). A role without the permission gets 403.

## Group 6: Admin CMS (`libs/admin/workshop-invoices`)

- [ ] 6.1 Feature lib following the convention: `api.service.ts`, `lib.routes.ts`, list, `manage/`.
- [ ] 6.2 List: franchise, invoice-date range, status and search; columns for number, invoice date, supply date, bill-to, qty, total, status and cancelled; PDF and cancel actions shown by permission.
- [ ] 6.3 Form, in Material with `var(--mat-*)` tokens:
  - franchise (the admin's only); bill-to block with country/State pickers and optional GSTIN; place-of-supply State defaulting to the bill-to State;
  - required/optional bill-to fields and their validation messages as in decision 13;
  - description, quantity, unit rate and currency (no SAC input; it comes from production config, decision 9);
  - live tax preview showing CGST/SGST or IGST and the total;
  - payment status, mode, reference and date; invoice date (default today) and supply date;
  - the confirmation dialog for the backdate warning;
  - locked fields disabled after issue.
- [ ] 6.4 Menu item under finance, hidden without Read.
- **Gate:** `cd eatfit247-admin && npx nx affected --target=lint,test,build`, then the browser walk-through in validation.

## Group 7: One-off renumbering script (money, production data)

- [ ] 7.1 TypeScript script in `server_1`, run with ts-node.
  - **Inputs:** franchise ID, cut-off date (2026-08-11), the three workshop invoice IDs in order, and `--apply` (dry run without it).
  - **Steps:** one transaction, following decision 14 (lock the counter row, find N, move the numbers, assign N+1…N+3, set PAID, add 3 to the counter).
- [ ] 7.2 Guards and output (decision 15):
  - before and after checks that the series has no gaps or duplicates;
  - the three invoices' preconditions;
  - refuse a second run (checked in the log);
  - moves go through temporary values so the unique index never clashes;
  - prints N and the old → new list, and writes a CSV.
- [ ] 7.3 Log every changed row in `txn_invoice_renumber_log` (decision 16).
- [ ] 7.4 Tests on a seeded copy:
  - a series with numbers dated before and after the cut-off, including out-of-date-order rows;
  - dry run writes nothing;
  - apply gives the expected mapping and counter +3, with no gaps or duplicates;
  - a second run is refused;
  - every precondition failure is refused;
  - an injected error rolls everything back;
  - product (P) invoices and other franchises are unchanged.
- **Gate:** the tests pass, and a dry run on the local production copy prints N = the highest number dated on or before 11 Aug (000351 on the 17 Oct copy) and the expected shift count.

## Group 8: Local walk-through with the real request

- [ ] 8.1 On a DB matching this branch's schema (see the validation pre-condition), create the three invoices as Financial Manager: 200 / 200 / 174 × ₹850 for EFMUM, **PENDING**, invoice date and supply date 11 Aug 2026, with payment details filled. Use placeholder bill-to details locally; the admin enters the real organiser details in production.
- [ ] 8.2 Run the script dry, then with `--apply`. Check:
  - the three invoices are PAID with numbers N+1…N+3;
  - totals are ₹200,600 / ₹200,600 / ₹174,522;
  - every later number moved up by 3 and the counter grew by 3;
  - a member invoice PDF downloaded after the run shows its new number;
  - the workshop PDFs show the description, qty, rate, SAC, tax split, date of supply and amount in words.
- [ ] 8.3 Create one more test workshop invoice and mark it PAID: it takes the next number with no gap. Cancel it: the number stays and the PDF says CANCELLED.

## Group 9: Close-out

- [ ] 9.1 Every check in `validation.md` passes; the deep review by subagents is done (bugs, franchise leakage, invoice gaps, conventions).
- [ ] 9.2 `requirements.md` status → Shipped. Add roadmap row **4.15 Workshop invoices** ✅ with a link, and note:
  - the merge-forward follow-up: move to `InvoiceIssueService` when 4.5–4.14 lands, running the renumbering first;
  - the owner-approved exception to "issued invoices are never changed".
- [ ] 9.3 Note for replanning: should the 4.5–4.14 branch adopt the optional `invoiceDate` from group 3?
