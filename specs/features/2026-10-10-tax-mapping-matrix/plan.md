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

## Group 6: Close-out

- [ ] 6.1 All checks in `validation.md` pass
- [ ] 6.2 `requirements.md` status → Shipped; roadmap 4.11 data half → ✅ with a link
- [ ] 6.3 Constitution changes (mission markets table) noted for the replanning step
