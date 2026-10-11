# Plan: Tax Mapping Matrix

> Source: [requirements.md](./requirements.md) · Done when: [validation.md](./validation.md) passes
>
> Tax and migrations: implement **one group at a time**. Unit-test, live-test on the local servers (members 4945 US / EFMUM, 5888 UAE / HCUAE, 5889 India / HCUAE, plus an India same-State and other-State member), review, then commit only that group's paths before starting the next.
> If review finds a gap, add a new group here rather than patching silently.
> **Never pay a product order locally without warning the owner**: the local courier account books live NimbusPost shipments.

## Group 0: Spec and constitution

- [x] 0.1 `requirements.md`, `plan.md`, `validation.md` written from the templates with the legal findings, mapping table and gap register.
- [x] 0.2 `specs/product/roadmap.md`: 4.11 split into the data half (this feature) and the CA-dependent half.
- [x] 0.3 `specs/product/mission.md`: markets table extended with goods and the three special rows (INR-paid foreign client, Indian client of a foreign franchise, electronic service).

## Group 1: Migration 144, contract and models

- [x] 1.1 `db_changes/144_tax_mapping_matrix.sql` (idempotent, in a transaction):
  - `mst_tax_master.hsn_sac_code VARCHAR(8)`, `legal_basis TEXT`
  - `mst_program_plan.is_electronic_service BOOLEAN NOT NULL DEFAULT FALSE`
  - `mst_countries.currency_code CHAR(3)`; set IN→INR, AE→AED, US→USD
  - `place_of_supply_country_code CHAR(3)`, `place_of_supply_state_code VARCHAR(10)` on `txn_member_payments` and `txn_member_product_order_items`
  - back-fill `hsn_sac_code` on existing PRODUCT rules from `mst_product.hsn_code`, and on SERVICE rules with `999319` where null
  - seeds, each `INSERT … WHERE NOT EXISTS` on `(franchise_id, reference_id, country_code, tax_code, effective_from)`:
    - EFMUM (1) · `IN` · SERVICE · ref 1 · `GST_18` · 18 · STANDARD · `999319` · from 2017-07-01 · basis: Notif 11/2017-CT(R) heading 9993; kept at 18% pending CA (requirements decision 2)
    - HCUAE (2) · `AE` · SERVICE · ref 1 · `VAT_0` · 0 · ZERO_RATED · `999319` · from 2018-01-01 · basis: ER Art 41 per UAE adviser; confirm licence, else 5% STANDARD
    - MEMUM (3) · `IN` · PRODUCT · one pair per active `mst_product`: `NONE_0` · 0 · active · basis: unregistered, CGST s.24(i); and `GST_5` · 5 · STANDARD · **inactive** · HSN from the product · from 2025-09-22 · basis: Notif 9/2025-CT(R) Sch. I (2106 / 3004)
  - seed `created_by` = system admin id used by earlier migrations; header comment lists which rows the CA may activate
- [x] 1.2 Apply 144 twice on the local DB (no error, same row counts), and once on a DB that already has hand-entered EFMUM/HCUAE rules (no duplicates).
- [x] 1.3 shared-library: `ITaxMaster.hsnSacCode` / `legalBasis`, `ICalculateTaxResponse.placeOfSupplyCountryCode` / `placeOfSupplyStateCode`, `IProgramPlan.isElectronicService`, `ICountry.currencyCode`; build.
- [x] 1.4 Models + DTOs: `MstTaxMaster`, `MstProgramPlan`, `MstCountry`, `TxnMemberPayment`, order-item model; tax-master / program-plan / country DTOs validate the new fields (`hsnSacCode` 4–8 digits).

> **As built (group 1):**
> - `144_tax_mapping_matrix.sql`: `hsn_sac_code` / `legal_basis` on rules (back-filled from `mst_product.hsn_code` and `999319`), `is_electronic_service` on plans, `currency_code` on countries (IN/AE/US set; the missing `AE` / `US` ISO codes from seed 101 are filled too), place-of-supply columns on payments and order items. Seeds are guarded per (franchise, reference, country, type): on the local DB, which already had hand-entered EFMUM 18 / HCUAE 0 Z / MEMUM 12 rows, only the **staged inactive MEMUM GST_5** row was added (its guard checks for an existing 5% rule, not any GST rule, because production carries GST 12%). A rolled-back run on an emptied table produced the full seed set. Applied twice: NOTICEs only.
> - shared-library: `ITaxMaster.hsnSacCode` / `legalBasis`, `ICalculateTaxResponse.placeOfSupplyCountryCode` / `placeOfSupplyStateCode` / `hsnSacCode`, `IBaseProgramPlan.isElectronicService`, `IBaseCountry.currencyCode`.
> - server: models (`MstTaxMaster`, `MstProgramPlan`, `MstCountry`, `TxnMemberPayment`, order item), DTOs (`hsnSacCode` 4–8 digits, `legalBasis` ≤ 1000, `isElectronicService`, `currencyCode`), tax-master / program-plan / country services round-trip the fields. Member jest 265/265; both API apps build. The `platform` jest project fails to load on the base commit too (enum import cycle in `mst-franchise.model.ts`), unrelated.

## Group 2: Engine hardening (`server_1/libs/modules/tax-engine`, `member`)

- [x] 2.1 `TaxResult` carries `placeOfSupplyCountryCode` and `placeOfSupplyStateCode` (goods: delivery; services: billing; exports: destination country, state null). `member-plan.service.ts` and `member-product.service.ts` save them; `invoice.mapper.ts placeOfSupplyOf()` prefers the stored codes and falls back to the address only when both are null.
- [x] 2.2 Unregistered inter-state goods guard: domestic branch, `rule.taxSystem === NONE && supplier === IN && transactionType === PRODUCT && deliveryState !== supplierState` → 400 "Inter-state goods supply needs GST registration (CGST s.24(i)). Ask the CA." unless config `ALLOW_UNREGISTERED_INTERSTATE_GOODS = true`.
- [x] 2.3 Per-plan rule reference: plans pass `referenceId: programPlanId`; `getApplicableTaxRule` retries with `referenceId = 1` for SERVICE when no row matches. Invoice line SAC = `rule.hsnSacCode ?? DIET_SAC_CODE`; product line HSN = `rule.hsnSacCode ?? product.hsnCode`.
- [x] 2.4 Cross-border VAT by type: goods get a goods zero-rated export note and a "delivery address" reason; services unchanged.
- [x] 2.5 Supply date in the franchise time zone (`mst_franchises.time_zone`), not `Asia/Kolkata`.
- [x] 2.6 `invoice-issue.service.ts` functional currency from `mst_countries.currency_code`; single `INDIA_COUNTRY_CODE` constant (remove the copy in `invoice-series.util.ts`).
- [x] 2.7 Rounding: `IndiaGstService` rounds per line to 2 dp, CGST = round(tax/2), SGST = tax − CGST; VAT already rounded.
- [x] 2.8 Update affected unit tests (member jest stays green).

> **As built (group 2):**
> - `TaxResult` / `ICalculateTaxResponse` carry `placeOfSupplyCountryCode`, `placeOfSupplyStateCode` (domestic only; null for exports) and `hsnSacCode` (from the rule). Plans and product lines save all three (new `hsn_sac_code` column on payments and order items, added to 144); the mapper prints the stored State code (snapshot State name + stored code; "State code NN" if the snapshot has no name) and the stored HSN on product lines; the plan invoice line uses the stored SAC and falls back to `DIET_SAC_CODE` only for pre-144 rows.
> - Engine loads the franchise once (GSTIN, TRN, `time_zone`): the supply date is the franchise's local day (HCUAE → Asia/Dubai); `assertRegistration` is now synchronous on that row.
> - s.24(i) guard in the `NONE` branch for Indian goods delivered to another State, unless config `ALLOW_UNREGISTERED_INTERSTATE_GOODS` (seeded `false` in 144; `ConfigParam` added). Cross-border VAT uses a goods note / "delivery address" reason for products. GST amounts rounded to 2 dp with CGST = round(tax/2), SGST = remainder; IGST rounded the same way.
> - `TaxMasterService.getApplicableTaxRule` retries SERVICE lookups with `SERVICE_DEFAULT_REFERENCE` (1); plans pass their `programPlanId` through `IPlanTaxOptions`. `INDIA_COUNTRY_CODE` has one definition (platform) re-exported by the tax-engine constants. `InvoiceIssueService` takes the functional currency from `mst_countries.currency_code` (context field `functionalCurrency`; `applyFx` signature changed; FX specs updated).
> - Live (ts-node Nest context against the local DB): R1 CGST 90.45 + SGST 90.45 PoS IN/27; R2 IGST PoS IN/29; ref 999 falls back to ref 1; R5 0% under `AD270326000001T`; R5b (supply 2025-06-01T19:30Z → IST 2025-06-02, no LUT) IGST export; R6 INR domestic → IGST not export; R6b NRE/FCNR → export; R3/R4 MEMUM 12% incl. (local rule) with HSN 3004; R7 EXPORT_OF_GOODS with IGST (no MEMUM LUT); R8 VAT 0 Z PoS AE/1; R10 zero-rated export; R11 HCUAE PRODUCT → "no rule" 400 (configuration, as designed); R12 refused. Member jest 265/265; both APIs build.

## Group 3: Matrix test

- [x] 3.1 `server_1/libs/modules/member/src/tax/tax-engine.matrix.spec.ts`: a fixture array, one entry per mapping row 1–14 and variant (LUT valid / expired; routes DOMESTIC / INTERNATIONAL_CARD_GATEWAY / FOREIGN_REMITTANCE / RUPEE_VOSTRO / NRE_FCNR_ACCOUNT; same / other State; registered / unregistered franchise; INR / USD / AED; staged MEMUM 5% row active). Each case asserts `taxMode`, `taxCategory`, `taxPercentage`, `taxObj` keys and rounded amounts, `invoiceNote`, stored place-of-supply codes, and the series from `InvoiceSeriesUtil`.
- [x] 3.2 Mocks use the exact group-1 seed values, so the spec documents the seed.

> **As built (group 3):** `member/src/tax/tax-engine.matrix.spec.ts` — 26 cases: rows 1, 2, 5 (+ three INR export routes), 5b, 6, 14, 3/4 (staged 5% active, and seeded NONE with the s.24(i) refusal and CA override), 7 (LUT / no LUT / unregistered), 8 (0% Z and 5% S), 9, 10 (US and a GCC state), 11/13, 12, the plan-specific rule fallback (A15), Asia/Dubai vs IST supply day (A16) and rounding (A17). Series assertions go through `InvoiceSeriesUtil.resolve`. Mocks use the 144 seed values. 3.2: the migration's seed counts were proven by the rolled-back fresh run in group 1 (4 rows: EFMUM GST_18, HCUAE VAT_0 Z, MEMUM NONE_0 + staged GST_5); no separate harness.

## Group 4: Admin CMS (`eatfit247-admin`)

- [ ] 4.1 Tax master form + list: `hsnSacCode`, `legalBasis`; inactive staged rows shown with an "activate when the CA confirms" hint. Files under `libs/admin/tax-master/src/lib/`.
- [ ] 4.2 Program-plan form: `isElectronicService` toggle with helper text (UAE Art 23).
- [ ] 4.3 Payment / product tax preview shows the stored place-of-supply State and the new s.24(i) refusal message.
- [ ] 4.4 Hide deprecated fields: franchise `internationalTaxMode`, `lutNumber`; country `taxType`, `defaultTaxPercentage` (read-only note, no DB drop).

## Group 5: Public website (`eatfit247-web-1`)

- [x] 5.1 One tax statement everywhere, driven by the server's inclusive flag / tax label: product page, checkout, seasonal plans, FAQ, nutritionist pages (remove hardcoded "+ taxes" prices or label them "excl. GST").
- [x] 5.2 Checkout State field: hint "Required for your tax invoice (place of supply)". No new API.

> **As built (group 5):** the checkout total line now reads from the decided tax (`totalNote`: "Includes GST 18%" / "Includes IGST 18%" / "Export – no Indian GST charged" / "Zero-rated – no tax charged" / "No tax applies") instead of a fixed "Inclusive of all taxes"; the State field carries the place-of-supply hint; the FAQ "Is GST included?" answer now matches the rules (plan fees before tax, powder prices tax-inclusive, exports untaxed, INR from Indian accounts taxed). Product page "Inclusive of all taxes" and seasonal "Taxes extra" were already right for their price rules (products inclusive, plan fees exclusive) and stay. SSR build green. Browser pass pending with the admin forms.

## Group 7: Review fixes (deep review 2026-10-11)

- [x] 7.1 **High** — admin tax-master: the reference no longer leaks across type switches (SERVICE → reference 1, PRODUCT → empty; edit patch uses `emitEvent: false`).
- [x] 7.2 **High** — goods place of supply never falls back to the billing State: delivery in India without a delivery State → 400; the s.24(i) guard treats an unknown State as inter-state. New matrix case.
- [x] 7.3 **Medium** — `place_of_supply_country_code` is `VARCHAR(3)` (guarded `ALTER … TYPE` repairs a DB that ran the CHAR(3) draft); real unit test for the SERVICE reference fallback (`tax-master-lookup.spec.ts`); `changeStatus` runs the consistency check when activating a staged rule and `update` skips the registration check for inactive rows; warning when a franchise country has no `currency_code`; 144 header and decision 8 say the config override needs an API restart.
- [x] 7.4 **Low** — decision 4 text matches the seed guards; constant placement; JSDoc order; staged hint keyed on a `STAGED` legal basis; s.24(i) goods-only rationale commented.
- [x] 7.5 Member jest 296/296 (21 suites); both APIs and the admin development build green; 144 re-applied locally (columns now `character varying(3)`).

## Group 8: Browser-run fixes — public checkout backend (F1, F2, F3; `server_1`)

Findings from the 2026-10-11 browser run (`validation.md` → Findings). One group per layer; each group is unit-tested, checked against the running local servers and committed on its own.

- [x] 8.1 **F1 High** — `MemberPlanService.createPublicCheckoutOrder` resolves the gateway with `member.franchiseId` (the franchise the payment row and invoice belong to), never `franchiseByBusinessType(SERVICE)[0]`; a member without a franchise is a 400. The plan gateway listing gets a member-scoped route (`checkout/plan/member/:memberId/supported-gateways`, checkout token) that lists the member's franchise; the unauthenticated listing (used before the member exists) lists the default franchise. Products keep the product franchise (the order itself belongs to it).
- [x] 8.2 **F2 High** — `CheckoutGatewayService.resolveGateway` takes `isInternational` from the caller instead of `false`: international when the billing country differs from the franchise country (fallback: the engine's payment route is not DOMESTIC). Plan and product orders, admin payment links and `assertGatewayAvailable` pass it.
- [x] 8.3 **F3 Medium** — `MemberService.createOrUpdate` finds the existing member by email/phone first and only resolves the franchise by country for a new member; the "no default franchise" error names the fix. Release runbook: set `mst_franchises.is_default` on EFMUM (decision 23).
- [x] 8.4 Unit tests for 8.1–8.3 (member jest green); live check: USD plan order for member 4945 and an AED/HCUAE member resolve their own franchise's gateway; `member/create` for an existing member works with no default franchise.

> **As built (2026-10-11):** `CheckoutGatewayService.isInternationalPayment(billingCountryId, franchiseCountryId, route)` is the one rule (countries differ → international; without both countries, a non-DOMESTIC route); `resolveGateway` / `prepareGateway` / `createGatewayOrder` / `createGatewayPaymentLink` / `assertGatewayAvailable` take the flag; plan + product public orders, admin links and link regeneration pass it. Plan orders use `member.franchiseId` (tax already refuses a member without one). `FranchiseService.getDefaultFranchise()`; `GET checkout/plan/member/:memberId/supported-gateways` (checkout token; 403 on a token for another member). `createOrUpdate` resolves the franchise only on the new-member branch; the dead `resolveGatewayAndCredentials` in the product service was removed. Member jest 305/305 (22 suites, 8 new cases); both APIs build. Live (Nest context + curl): USD row 4 set international-only → domestic payer refused, international payer resolves; HCUAE member 5888 USD order → "No payment gateway configured for franchise=2" and nothing stored; member route lists franchise 1 for 4945 and nothing for 5888 (HCUAE Stripe row inactive, F10). Browser end-to-end of the order path waits for the web changes in group 9 (the order route needs reCAPTCHA).

## Group 9: Browser-run fixes — public website (F4, F5, F9-web; `eatfit247-web-1`, `server_1` program-plan)

- [x] 9.1 **F4 Medium** — public `GET program-plan/:id` (active + visible on web, else 404); the checkout resolves `?plan=` by id instead of from the 15-row list.
- [x] 9.2 **F5 Medium** — a failed billing step keeps the form (only a failed plan/product load hides the stepper); the error banner stays above the form so the user can correct and retry.
- [x] 9.3 **F9 web** — product size price formatted with two decimals (no "1199.97.00"); plan checkout success shows no Packed/Shipped/Delivered timeline and no "Pan-India shipping" / replacement promises (products only).
- [x] 9.4 Web gateway listing uses the member-scoped route once the member exists (8.1). Web lint + build green; browser check of plans 221/224 and a billing error retry.

> **As built (2026-10-11):** `GET program-plan/:id` (`ProgramPlanService.findPublicById`, 404 unless active + visible, 400 on a non-numeric id); `ProgramPlanService.getProgramPlanById` on the web replaces the list scan. `checkoutBlocked` (plan/product failed to load) is the only thing that hides the stepper; a billing-step failure shows the server's message (`errorMessage`, not the generic line) above the form, which stays editable. Product size price `number:'1.2-2'`; plan checkout shows no Packed/Shipped/Delivered timeline and no shipping/replacement promises ("Invoice available right after payment"); the success page's "Processing" shipping chip is products-only. `getSupportedPaymentGatewaysForPlan(currency, memberId)` uses the member route once the member exists. Web production build green; eslint on the touched files reports only pre-existing findings (template click handlers at line 506, empty catch). Browser (:4300): `?plan=221` loads (USD 2,500 for a US address); with `is_default` unset, a new US member got "No franchise serves this country … (set is_default …)" with the form intact, and after restoring the flag the same click created member 5890 and reached the review step (export 0% under LUT, member-scoped gateway route 200); "Continue to Payment" created order 5149 on gateway row 4 while that row was international-only (F2 end to end). The Razorpay iframe would not accept typed input in this session, so 5149 stays PENDING (like 5144). Product page: "INR 1,199.97"; plan success page: Paid chip only.

## Group 10: Browser-run fixes — admin CMS (F6, F7, F9-admin; `eatfit247-admin`, `server_1` DTO)

- [x] 10.1 **F6 Low** — plan fee must be ≥ 1 (form validator and `ProgramPlanFeeDto`); a gateway cannot charge 0.
- [x] 10.2 **F7 Low** — add-payment dialog: step 1 "Next" calculates tax first and stays on step 1 with the server's message when the engine refuses (HCUAE/Indian client); step 1 is not complete without a tax result.
- [x] 10.3 **F9 admin** — date-only columns (payment date, invoice date) render without a time (`dateFormat` on table columns; payment details dialog); franchise header shows the financial-year label ("Apr to Mar") instead of the raw id.
- [x] 10.4 Admin build green; browser check of the three screens.

> **As built (2026-10-11):** plan fee `Validators.min(1)` + `[min]="1"` (both plan forms) and `@Min(1)` on `ProgramPlanFeeDto.fees`. Add-payment dialog: `PaymentFormService.calculateTax` no longer swallows errors; `taxError` signal shows the engine's message inline on step 1 (`tax-warning` block), the Next button runs `proceedToTaxStep` (calculate first, advance only with a result) and step 1 is complete only with a tax result. `ITableColumn.dateFormat` (default unchanged) with `'dd MMM yyyy'` on the member payment-history and payment-report Payment Date columns; payment details dialog prints the date only. `financial-year.util.ts` (`FINANCIAL_YEAR_OPTIONS`, `financialYearLabel`) shared by the franchise form and the details header. Admin development build green (the production build fails only on the pre-existing bundle/SCSS budget errors); both APIs build. Browser (:4200, QA super admin): franchise 1 header "Apr to Mar"; payment history dates "11 Oct 2026"; member 5889 (Indian, HCUAE) add-payment → "Indian clients must be registered under the India franchise." inline and Next leaves the dialog on step 1; plan 263 USD fee 0 → "Minimum value is 1" (not saved).

## Group 11: Browser-run fixes — invoice PDFs (F8; `shared-library`, `server_1` template + credit note)

- [x] 11.1 Total row label readable (white on the dark row); the exchange-rate line sits under the totals box without overlapping.
- [x] 11.2 Seller / buyer address line never starts with ", " when the city is empty.
- [x] 11.3 Credit-note footer says "credit note"; export invoices print the remittance reference (FIRC / e-FIRA) and the transaction id; every PDF prints the amount in words.
- [x] 11.4 Shared-library + platform tests green; re-download invoices 000007 (USD), 000008 (FIRC), HCUAE 000006 and credit note CN/000004 and read the PDFs.

> **As built (2026-10-11):** `invoice.hbs`: `.total-row td` white on #333 (the `td:first-child` background rule was overriding the row), `.summary-section` is a column so the FX note sits under the totals, city/state line built with explicit separators, "Amount in words" under the totals via the registered helper (`{{amountInWords invoice.pricing.totalAmount invoice.currencyCode}}` — the bare `{{amountInWords}}` resolved to the helper with no arguments and printed "Rupees Zero"), "Remittance reference (FIRC / e-FIRA)" in the payment block. Mapper: plan invoices carry `transactionId` and both carry `remittanceReference` (`IInvoicePayment.remittanceReference`); address parts are trimmed (HCUAE's city was a single space, hence ", Dubai"). Credit note footer says "credit note". Member jest 306/306; shared-library built; both APIs build. Live (Nest context, admin-api module): regenerated 000007 (USD: "Dollars Two Hundred Fifty Only", FX line below the box), 000008 (FIRC-TEST-2026-0001 printed), HCUAE 000006 ("Dubai (AE-DU)", "Dirhams Four Thousand Two Hundred Fifty Two Only") and CN/000004 (credit-note footer); PDFs read back page by page.

## Group 6: Close-out

- [ ] 6.1 All checks in `validation.md` pass
- [x] 6.2 `requirements.md` status → Implemented, release pending (Shipped after the browser pass and production migration); roadmap 4.11 marked 🚧 with the split and a link
- [x] 6.3 Constitution changes (mission markets table) noted for the replanning step
