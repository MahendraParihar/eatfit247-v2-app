# Plan: Tax-Engine Correctness (India export, UAE VAT, FX, UAE Tax Credit Notes)

> Source: [requirements.md](./requirements.md) · Done when: [validation.md](./validation.md) passes
>
> Tax, invoices, RBAC and migrations: implement **one group at a time**. Unit-test, live-test on the local servers (members 4945 US / EFMUM, 5888 UAE / HCUAE, 5889 India / HCUAE), review, then commit only that group's paths before starting the next.
> If review finds a gap, add a new group here rather than patching silently.
> **Never pay a product order locally without warning the owner**: the local courier account books live NimbusPost shipments.

## Group 1: Tax-core migration and contract

- [x] 1.1 `db_changes/140_tax_engine_correctness.sql` (idempotent, in a transaction):
  - `tax_mode` + `EXPORT_OF_GOODS`
  - `mst_tax_master.tax_category` (STANDARD / ZERO_RATED / EXEMPT / OUT_OF_SCOPE, default STANDARD) and a check that 0% VAT rules aren't STANDARD
  - `mst_franchise_luts` (franchise_id, arn, financial_year, valid_from, valid_to, audit columns, active; no overlapping active periods per franchise)
  - `payment_route` enum (DOMESTIC, INTERNATIONAL_CARD_GATEWAY, FOREIGN_REMITTANCE, RUPEE_VOSTRO, NRE_FCNR_ACCOUNT)
  - `payment_route`, `remittance_reference` on `txn_member_payments` and `txn_member_products`
  - `tax_category`, `lut_arn`, `tax_decision_reason` on `txn_member_payments` and `txn_member_product_order_items`
  - backfill: HCUAE's AE service rule → ZERO_RATED; copy a non-empty `mst_franchises.lut_number` into the register as a row to be completed (FY and dates entered by Finance)
- [x] 1.2 Test 140 on a fresh DB and on a pre-140 clone (applies twice without error).
- [x] 1.3 shared-library:
  - enums `TaxCategoryEnum`, `PaymentRouteEnum`, and `TaxMode.EXPORT_OF_GOODS`
  - an `IFranchiseLut` interface
  - decision fields (`taxCategory`, `paymentRoute`, `remittanceReference`, `lutArn`, `taxDecisionReason`) on the tax-calculation, member-payment and product interfaces
  - build
- [x] 1.4 Models: new columns on `TxnMemberPayment` (including the missing `invoiceNote` attribute), `TxnMemberProduct`, the order-item model and `MstTaxMaster`; new `MstFranchiseLut`.

> **As built (group 1):**
> - 140 adds `EXPORT_OF_GOODS` with `ALTER TYPE … ADD VALUE IF NOT EXISTS` before the transaction. It creates `mst_franchise_luts` with nullable `valid_from` / `valid_to`, so a copied `lut_number` row is never valid until Finance enters dates; overlap checks live in the service (group 3). `payment_route` is a Postgres enum; `tax_category`, `lut_arn`, `tax_decision_reason` are on payments and order items. Existing 0% VAT rules become ZERO_RATED (HCUAE AE service). RBAC subject `FranchiseLut` (franchise-scoped) is seeded; the subject trigger granted it to Super Admin.
> - Applied twice locally without error.
> - Shared: `TaxCategoryEnum`, `PaymentRouteEnum` (`NRE_FCNR_ACCOUNT` per the NRE answer), `EXPORT_TAX_MODES`, `IFranchiseLut` / `IManageFranchiseLut`, decision fields on `ICalculateTaxResponse`, payments, products and order items; `ITaxMaster.taxCategory`.
> - Models: the missing `TxnMemberPayment.invoiceNote` is now mapped; new `MstFranchiseLut` (tax-engine lib); tax-master DTO/service carry `taxCategory`.

## Group 2: Tax decision engine (pure logic + unit test matrix)

- [x] 2.1 `TaxMasterService.getApplicableTaxRule`:
  - filter `active`, `transactionType` and the effective date
  - `ORDER BY effective_from DESC`
  - trim the country code
  - throw a typed "no tax rule for {franchise} / {country} / {type}" error instead of returning null
- [x] 2.2 Rewrite `TaxEngineService.calculate` as a decision with these inputs:
  - supplier country/state (franchise address; missing → typed error)
  - customer country/state (billing; missing → error)
  - delivery country (goods)
  - currency, payment route, transaction type
  - the supply date (for LUT and rule dates)
- [x] 2.3 Branches:
  - **Indian customer + non-IN franchise:** refuse (decision 6).
  - **Registration check (decision 18):** a GST rule without a franchise GSTIN, a VAT rule without a TRN, or an export (LUT) by an unregistered franchise → typed error.
  - **Same country:** the own-country rule. GST gives CGST+SGST/IGST and requires the state. VAT gives the rate + category. `NONE` gives no tax. A 0% VAT rule is saved as VAT 0% with its category.
  - **IN supplier, services, foreign customer:** route/currency per decision 2 → export (LUT valid → 0% + ARN; else IGST 18% export), or domestic IGST 18% with the reason.
  - **IN supplier, goods:** delivery country ≠ IN → `EXPORT_OF_GOODS` (LUT → 0%; else IGST).
  - **VAT supplier, foreign customer:** zero-rated export (Z, 0%) with the evidence reason; a `NONE` (unregistered) own rule → no VAT.
- [x] 2.4 `LutService.findValid(franchiseId, date)` (register lookup, used by 2.3).
- [x] 2.5 The result carries `taxMode`, `taxCategory`, `isLutApplied`, `lutArn`, `invoiceNote` (exact Rule 46 endorsement or zero-rating text), `taxDecisionReason`, and the jurisdiction (entity country, customer country, place of supply / country of destination). It never returns empty jurisdiction strings.
- [x] 2.6 Remove the dead code: the old export branch, the raw INR throw, and the unused `CountryTaxInfo`/EU constants (if still unused).
- [x] 2.7 Unit tests, one row per case in validation A1–A12:
  - EFMUM: IN same state, IN other state, IN without state, US+USD with LUT, US+USD without LUT, US+INR domestic, US+INR FOREIGN_REMITTANCE, US+INR NRE_FCNR (export)
  - MEMUM: goods delivered abroad, goods delivered in India
  - HCUAE: AE 0% Z, AE 5% S (config change), US zero-rated, IN refused, unregistered (`NONE`)
  - missing rule; missing franchise address
  - registration: GST rule on a franchise without a GSTIN refused; unregistered franchise with a `NONE` rule → plain invoice, no tax

> **As built (group 2):**
> - `TaxEngineService.calculate` rewritten as the decision in decisions 1–10/18: supplier country (franchise address) vs place of supply (billing; **delivery address for goods**, which also drives the domestic GST state for products, per GST place-of-supply for goods). Rule = franchise's own-country rule (`getApplicableTaxRule` now filters active + transaction type + effective on the supply date, newest first). Errors are 400 `BadRequestException`s with admin-readable messages (no rule; missing franchise/billing country or state; Indian client under a non-IN franchise; GST rule without GSTIN / VAT rule without TRN; export by an unregistered Indian franchise).
> - Route for services: explicit `paymentRoute`, else non-INR → INTERNATIONAL_CARD_GATEWAY, INR → DOMESTIC. Every route except DOMESTIC is export (NRE/FCNR included). INR on DOMESTIC → IGST with `taxMode DOMESTIC_GST` and a "not an export" reason.
> - Export notes are the exact Rule 46 texts (`constants/tax-notes.constant.ts`); UAE zero-rated exports carry an evidence note. LUT lookup: `LutService.findValid(franchiseId, date)` (dates required). Supply date defaults to today (IST).
> - `TaxResult` adds `taxCategory`, `lutArn`, `paymentRoute`, `taxDecisionReason`; jurisdiction strings are country names, never empty. Removed: the old export branch, the raw INR throw, `ITaxCalculationInput`, `CountryTaxInfo` / `StateTaxInfo`, `eu-countries.constant.ts`.
> - Tests: `member/src/tax/tax-engine.spec.ts` (23, the A1–A12/A22 matrix; the tax-engine lib has no jest project). Member jest 215/215.
> - Live (local config): EFMUM IN same state → CGST+SGST; US+USD and US+INR via NRE → export with IGST (no LUT row locally); US+INR → IGST not export; HCUAE UAE client → 400 "VAT rule but no TRN" (**release blocker: HCUAE's TRN must be entered in production before deploy**); Indian client under HCUAE → refused.

## Group 3: LUT register (backend + admin + RBAC)

- [x] 3.1 Admin endpoints: list / create / update / update-status for a franchise's LUTs. Validation: ARN format, FY matches the dates, no overlap. Franchise-scoped, with `@RequireAbility`.
- [x] 3.2 RBAC seed for the subject (in 140 or a follow-up data block), granted to Super Admin and Finance roles.
- [x] 3.3 Admin UI: an "LUT register" tab on franchise details (list, add/edit dialog, status chip valid / expiring in 30 days / expired). Material, tokens, `.html`/`.scss`.

> **As built (group 3):**
> - API (admin): `GET/POST /franchise-luts/:franchiseId`, `PUT /franchise-luts/:franchiseId/:lutId`, `PATCH …/:lutId/status` with `@RequireAbility(…, FranchiseLut)`. `LutService` enforces: ARN `AD` + 13 chars, FY `YYYY-YY` consecutive, dates inside 1 April – 31 March of that FY, no overlap with another active LUT of the franchise, unique ARN per franchise, franchise scope (an admin with `franchiseIds` only reaches those). Soft activate/deactivate only. `status` (VALID / EXPIRING ≤30 days / EXPIRED / FUTURE / INCOMPLETE / INACTIVE) is computed for today (IST).
> - RBAC: subject `FranchiseLut` seeded in 140 (Super Admin auto-granted by the subject trigger). Finance and other roles are granted in the RBAC screens (permissions live in data, principle 5).
> - Admin: franchise details → "LUT Register" tab (Material table, status chip, add/edit dialog with "use the whole financial year", activate/deactivate). Dev build green; the production build's existing size-budget errors (dashboard SCSS etc.) are unrelated.
> - Tests: `member/src/tax/lut.service.spec.ts` (11). Live (local DB): created `AD270326000001T` for EFMUM (kept as local test config), an overlapping LUT and a Dubai-scoped admin are refused, and EFMUM US+USD is now 0% under that LUT with the Rule 46 endorsement.

## Group 4: Wire callers (plans + products, admin + public)

- [x] 4.1 `member-plan.service.ts` `calculateTax` / `calculatePaymentObject` / `create` / `update` / `buildPaymentDraft`, plus `calculatePublicTax` / `createPublicCheckoutOrder`:
  - pass currency, route (server-set for gateway records: non-INR → INTERNATIONAL_CARD_GATEWAY, INR → DOMESTIC), supply date
  - save the new decision fields
  - require a billing address with country + state
- [x] 4.2 `member-product.service.ts`: the same, plus the delivery (shipping) country for goods; per-line saving of mode / category / ARN / reason.
- [x] 4.3 Route changes:
  - The route is a tax input: changing it re-prices an unissued manual record.
  - Gateway records and issued invoices keep the 4.5 amount lock.
  - Admin DTOs accept `paymentRoute` + `remittanceReference` only for manual records (`@ValidateIf`); public DTOs never accept them.
- [x] 4.4 Indian-customer guard (decision 6):
  - in tax paths (from 2.3) with a clear 400
  - in admin member create/update/`updateFranchise`: a warning when the franchise country isn't IN and the billing/profile country is IN
  - public signup keeps mapping by country
- [x] 4.5 Specs: update the mocked tax inputs in the existing member specs; new tests for the route lock and the guard.
- [x] 4.6 Invoice series (4.7 shipped first): swap the body of 4.7's `resolveInvoiceSeries` from the interim billing-country rule to the stored tax mode (EXPORT for `EXPORT_OF_SERVICE` / `EXPORT_OF_GOODS`, including IGST-paid exports), so a foreign client paying INR over Indian rails goes to DOMESTIC. Update the 4.7 tests and the 4.7 spec's decision 1 note.

> **As built (group 4):**
> - Plans: one `calculatePaymentObject(…, options)` serves the admin preview (`calculateTax`, which no longer duplicates the address logic), admin create/update (`buildPaymentDraft`) and public checkout. `taxOptions()`: manual → the admin's route (default DOMESTIC) and the payment date as supply date; gateway / public → no route (the currency decides) and today. A missing franchise is a 400, not a TypeError. The payment stores `taxCategory`, `lutArn`, `taxDecisionReason`, `paymentRoute`, `remittanceReference` (manual only), and edits refresh them together with `invoiceNote`. `IPlanTaxCalculationRequest` gains `paymentSource` / `paymentRoute` / `paymentDate`.
> - Products: `calculateTax` / `calculateOrderItemsTax` take the delivery (shipping) address and route/supply-date options; every line stores the decision fields; the order stores `paymentRoute` (manual: admin's; gateway: by currency) and `remittanceReference`.
> - DTOs: admin plan and product DTOs accept `paymentRoute` (enum) and `remittanceReference` (≤100); the service ignores them for gateway records. Public DTOs don't accept them.
> - 4.6 (series): `InvoiceSeriesUtil.resolve` now uses the stored tax mode(s): EXPORT for `EXPORT_OF_SERVICE` / `EXPORT_OF_GOODS` (LUT or IGST-paid); product lines must agree (else 400); records priced before 4.6 (`NO_TAX`) keep 4.7's billing-country rule so they match migration 138; non-Indian franchises are always DOMESTIC. `InvoiceIssueService` reads product line modes in the issuing transaction; the edit guard passes the draft's mode.
> - 4.4: the engine refuses Indian clients under a non-IN franchise on every tax path. The admin **member-edit warning** moves to group 6 (client-side), since a server warning would need a new member API shape.
> - Tests: series-rule cases added (`invoice-numbering.spec.ts`), confirmation spec mocks product line modes. Member jest 233/233.
> - Live (local DB, payments kept as test data): 4945 US+INR DOMESTIC → IGST 18%, `EFMUM/2026-27/S/000010`; US+INR via NRE/FCNR with FIRC ref → 0% under `AD270326000001T`, `EFMUM/EXP/2026-27/S/000002`; India billing → CGST+SGST; 5889 (India, HCUAE) refused; product preview to a US address → EXPORT_OF_GOODS with IGST 12% (MEMUM has no LUT).

## Group 5: Website checkout (`eatfit247-web-1`)

- [x] 5.1 Pick the plan fee by billing country: outside India → the plan's non-INR fee if present, else INR. Send the chosen currency (an existing plan fee only; the server re-validates it).
- [x] 5.2 The summary shows the server-decided tax label ("Export – 0% (LUT)", "IGST 18%", "VAT 0% (zero-rated)") and the currency. Zoneless: signals only.
- [x] 5.3 Product checkout: shows the export-of-goods result for foreign delivery addresses.

> **As built (group 5):** plan checkout picks the fee after the billing step: India → INR; other countries → the plan's USD fee, else any non-INR fee, else INR (the server prices INR + IGST); a currency change drops the previous quote. The server still accepts only an existing plan fee. The sidebar's "Tax" row shows the server's treatment (`Export – 0% (LUT)`, `IGST 18% (export)`, `VAT 0% (zero-rated)`, `GST 18%` / `IGST 18%`, `No tax`) for plans and products; plan summaries now pass `taxCategory` / `lutArn` / `taxDecisionReason` through. SSR build green; the checkout file's lint error (empty catch at line 350) already existed. **Browser check pending:** needs the API restarted on this code and a USD fee on a test plan (group 11.1).

## Group 6: Admin payment and product forms (`eatfit247-admin`)

- [x] 6.1 Manual payment form:
  - payment route select + remittance reference, shown when the franchise is Indian and the billing country isn't India
  - default DOMESTIC with a hint that a foreign route needs a FIRC/e-FIRA
- [x] 6.2 The tax preview shows the decision reason and warnings (LUT expired / expiring, INR from a foreign client → IGST, Indian client under a UAE franchise → blocked).
- [x] 6.3 Place-product-order dialog: the same preview reason; route for manual orders.
- [x] 6.4 Tax-master form:
  - VAT category select
  - allow a `NONE` rule (unregistered)
  - allow product references for PRODUCT rules
  - remove the forced `referenceId=1` only where it's wrong for products
- [x] 6.5 Franchise form: GSTIN optional (format + checksum when given); `vat_number` labelled "TRN" for VAT franchises, with 15-digit validation. Tax-master save refuses rules that don't match the franchise's registration (decision 18).

> **As built (group 6):**
> - Manual plan payment form: "How the money arrived" (five routes) and "FIRC / e-FIRA reference", shown for a manual payment whose billing address is outside India; route and payment date re-run the tax preview (`IPlanTaxCalculationRequest` now carries `paymentSource` / `paymentRoute` / `paymentDate`). The tax summary shows the server's `taxDecisionReason` and warnings: no valid LUT (export charged IGST), INR over Indian methods from a foreign client (IGST, not export), missing FIRC reference on an export.
> - Product order dialog: the decision reason above the summary, and route + FIRC reference for manual orders (stored; goods tax doesn't depend on the route).
> - Tax master: "Tax category" select (S/Z/E/O) with a hint; the tax system list already includes NONE and product references were already supported. Server: `TaxMasterService` refuses a 0% STANDARD VAT rule, a GST rule for a franchise without a GSTIN and a VAT rule without a TRN (decision 18); `TaxMasterService` is now exported.
> - Franchise form: "GSTIN" (optional, GSTIN format) and "VAT number / TRN" (8–20 alphanumerics; UAE 15-digit TRN hint).
> - Deferred: member-form warning for an Indian client under the UAE franchise (spec updated; payment-time refusal covers it).
> - Tests: `member/src/tax/tax-master.service.spec.ts` (4). Member jest 237/237; admin dev build green.

## Group 7: Invoice rendering, India (shared mapper + template)

- [x] 7.1 Mapper and `invoice.hbs`:
  - the exact Rule 46 endorsement from the saved `invoiceNote`, the LUT ARN and FY
  - country of destination for exports
  - place of supply (state name and code, or country), fixing the misspelt `playOfSupply` / `formatDate` binding
  - title "TAX INVOICE" for GST invoices, including exports
- [x] 7.2 The supplier tax ID is printed whenever the franchise is registered (GSTIN for EFMUM, TRN for HCUAE), including on export and zero-rated invoices. An unregistered franchise (`NONE` rule) prints no tax ID and no tax line.
- [x] 7.3 Mapper unit tests (new spec file): domestic, export LUT, export IGST, foreign + INR IGST, goods export.

> **As built (group 7):** mapper adds `header.placeOfSupply` ("State (code)" for domestic GST; the country for exports and for a foreign client taxed IGST) and `header.countryOfDestination` (exports), `tax.lutArn` (0% exports) and `tax.taxCategory`. Export tax rows show IGST (0 under LUT, the charged amount without one) for services and goods. The supplier tax ID is chosen by the franchise's country: Indian → GSTIN, otherwise VAT number labelled TRN for the UAE; printed whenever present, including on no-tax invoices. `invoice.hbs`: the misspelt `playOfSupply` / `formatDate` binding is replaced; country of destination and the LUT ARN are printed. GST invoices (exports included) are titled "TAX INVOICE". Tests: 5 more mapper cases (10). Render check: 5132 → "TAX INVOICE", `EFMUM/EXP/2026-27/S/000002`, place of supply / destination United States, IGST 0%, Rule 46 endorsement, LUT ARN, GSTIN.

## Group 7b: Review fixes (groups 1–4)

- [x] 7b.1 **Issued invoices are locked like gateway records** (decision 11/17, principle 10): a manual payment with an `invoice_id` refuses a plan / currency / discount / billing-address / route change ("Issue a credit note…"), keeps its stored price, tax and billing snapshot on any other edit (no recalculation), and may still record a FIRC reference. The preview reports the same block. Before this, fixing a transaction id on an issued foreign-client invoice re-priced it with 18% IGST.
- [x] 7b.2 Locked records (gateway or invoiced) build the edit draft from their stored pricing, so an edit never fails on configuration that changed since (e.g. a missing TRN).
- [x] 7b.3 A non-INR payment is foreign money whatever route was picked: an explicit DOMESTIC with a foreign currency is treated and stored as FOREIGN_REMITTANCE (engine, product orders).
- [x] 7b.4 Goods need a shipping address with a country; the billing country is no longer used as the place of supply.
- [x] 7b.5 140: only ARN-shaped `lut_number` values are copied into the register (long free text would abort the migration); VAT category vs rate constraint `chk_mst_tax_master_vat_category_rate` (rate > 0 ⇒ STANDARD; 0% ⇒ not STANDARD) replaces the 0%-only check; `TaxMasterService` refuses the same combinations.
- [x] 7b.6 The admin tax preview requires the billing address like saving does (no fallback to the shipping address).
- [x] 7b.7 Rule and LUT lookups use the supply date as `YYYY-MM-DD` strings (no UTC-midnight edge); timestamp supply dates are converted to the Indian calendar day.
- [x] 7b.8 Logged, not changed: product rules are keyed by product id — **every production product needs its own tax rule before deploy** (release check); the "order lines disagree" error can only come from a bug (all lines share one address); LUT create has no exclusion constraint (single-admin screen; overlap is checked in the service); the tax-engine admin controllers are also mounted on public-api behind JwtAuthGuard + AbilitiesGuard (existing pattern).
- [x] 7b.9 Tests: issued-invoice lock (2), USD on DOMESTIC route, product without shipping address, 5% zero-rated rule. Member jest 246/246. Live: editing 5128's transaction id keeps NO_TAX / 5085; a discount change is refused with the credit-note message.

## Group 8: UAE VAT invoices

- [x] 8.1 Title "TAX INVOICE" with the TRN for VAT-registered franchises (any VAT rule, including 0%); plain "INVOICE" for a `NONE` rule.
- [x] 8.2 VAT category (S/Z/E/O), rate and VAT amount per line; zero-rating evidence note for exports.
- [x] 8.3 Amount in words in the invoice currency (AED dirhams/fils, USD dollars/cents; no "Rupees/Paise").
- [x] 8.4 Mapper tests: AE 0% Z, AE 5% S, foreign zero-rated, unregistered.

> **As built (group 8):** VAT invoices (any VAT rule, 0% included) are titled "TAX INVOICE"; `NONE` gives "INVOICE". VAT tax rows carry the category letter (`VAT (S)` / `(Z)` / `(E)` / `(O)`) from the stored `taxCategory`, and the template now prints each non-GST tax row with its rate in the summary, even at 0% (it previously hid a zero tax line). The zero-rated export evidence note comes from the stored `invoiceNote`. Amount in words follows the invoice currency: Rupees/Paise with Indian grouping for INR; Dirhams/Fils, Dollars/Cents, Euros, Pounds/Pence etc. with thousand/million grouping otherwise. Per-line VAT on product invoices stays with 4.10 (product invoices still have no tax rows). Tests: 5 more mapper cases (15). Render check: a zero-rated HCUAE invoice shows "TAX INVOICE", TRN and "VAT (Z) @ 0%: 0.00".

## Group 9: Exchange rates (fetch, store, apply at issue)

- [ ] 9.1 Spike: confirm how to fetch from the official publishers only, FBIL (fbil.org.in) and the UAE Central Bank (centralbank.ae): format, publish time, holidays, currencies covered. No third-party aggregators (decision 19). Record the result and any cross-rate rule in requirements.md before coding.
- [ ] 9.2 `db_changes/141_exchange_rates.sql`:
  - `mst_exchange_rates` (rate_date, from_currency, to_currency, rate, source, audit columns, active; unique per date + pair + source)
  - FX columns on payments and products: `fx_rate`, `fx_rate_date`, `fx_source`, `functional_currency`, `functional_total_amount`, `functional_tax_amount`
  - mark `mst_currency_configs` deprecated (no data change)
- [ ] 9.3 Shared enum `ExchangeRateSourceEnum` and an interface; model + service. `findRate(from, to, onOrBefore, purpose)`: goods → CBIC_CUSTOMS; services → FBIL for INR, CBUAE for AED; a MANUAL override for that day wins.
- [ ] 9.4 Daily `@nestjs/schedule` job:
  - fetch FBIL + CBUAE with upserts and timeouts
  - backfill "FX pending" invoices
  - log and alert on failure; never called from payment paths
- [ ] 9.5 At invoice issue (the PAID transition for plans and products, in `PaymentConfirmationService` and the admin/manual paths): save the FX fields when the invoice currency ≠ the franchise's functional currency (INR for IN, AED for AE). No rate → leave null (FX pending).
- [ ] 9.6 Admin endpoints + UI "Exchange rates": list by date and pair, manual entry/override, CBIC customs rate entry (fortnightly validity). RBAC-seeded.
- [ ] 9.7 Invoice shows the INR (Indian export) or AED (UAE) equivalents and the rate line. Tests for rate selection (weekend/holiday fallback, override, goods vs services) and backfill.

## Group 10: UAE Tax Credit Notes

- [ ] 10.1 `db_changes/142_credit_notes.sql`:
  - `txn_credit_notes` (franchise, original payment/product ref, original invoice number and date, credit-note number, date, reason, event date, currency, amounts, tax category/rate, FX copied from the original, audit columns, active)
  - `txn_credit_note_items`
  - a credit-note series in the invoice-sequence mechanism (`{code}/{FY}/CN/{seq}`)
  - RBAC subject seed
- [ ] 10.2 Shared interfaces; `CreditNoteService.create`:
  - row-lock the original
  - check it's an issued invoice of a VAT franchise
  - amount ≤ invoice total − earlier credit notes
  - VAT reversed at the original rate and category
  - number issued inside the transaction (no gaps)
  - a warning flag when issued more than 14 days after the event date
- [ ] 10.3 Admin endpoints (create, list per member/payment, PDF) and a "Tax credit note" action on the payment-history and product-order rows of VAT franchises.
- [ ] 10.4 PDF template "TAX CREDIT NOTE": supplier TRN, credit-note number/date, original invoice number/date, reason, VAT reversed, AED values.
- [ ] 10.5 Tests: amount limits, sequential numbers under concurrency, partial credits, rejection for GST franchises (4.9).

## Group 11: Config, live validation and close-out

- [ ] 11.1 Local config:
  - EFMUM IN GST 18 (exists)
  - HCUAE AE VAT 0 ZERO_RATED (backfilled)
  - an LUT row for EFMUM and MEMUM (test ARN)
  - a USD fee on the test plan
  - franchise data per decision 18: EFMUM keeps `27CSEPS5397E1Z8`; HCUAE GSTIN cleared and TRN entered; Mahi GSTIN cleared and its rule set per the CA's answer on registration
- [ ] 11.2 Live checks on members 4945 / 5888 / 5889 per validation.md (new test payments only; don't touch issued 5125–5128).
- [ ] 11.3 All checks in `validation.md` pass; deep subagent review; findings → new groups.
- [ ] 11.4 Owner production config before release: the same franchise data, HCUAE's real TRN, USD plan fees, LUT rows.
- [ ] 11.5 Status → Shipped. Roadmap:
  - 4.6 ✅ with a link
  - 8.0 marked "merged into 4.6"
  - 4.10 trimmed of FX
  - 4.9 notes "reuses the credit-note engine"
- [ ] 11.6 Constitution notes for replanning: mission Markets table (export only for foreign-currency / NRE-FCNR receipts; Indian clients → India franchise; Mahi's registration status); tech-stack (daily FX job, new migrations).
