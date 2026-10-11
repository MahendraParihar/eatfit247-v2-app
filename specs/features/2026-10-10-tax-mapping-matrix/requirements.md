# Requirements: Tax Mapping Matrix (franchise × customer × goods/services → tax)

| Field | Value |
|-------|-------|
| Status | **Implemented 2026-10-11, release pending** (browser walk-through and the CA / UAE adviser answers outstanding; see [validation.md](./validation.md)) |
| Branch | `feature/tax-mapping-matrix` (stacked on `feature/tax-engine-correctness`; retarget to `m3-cms-update` once 4.6 merges) |
| Roadmap | Phase 4: **4.11** Rate and classification master (data half; the CA-dependent rate decisions stay open) |
| References | [Accounting audit](../../backlog/2026-10-10-accounting-audit.md) H5, M3, part of H1/H6/H8; [4.6 requirements](../2026-10-10-tax-engine-correctness/requirements.md); IGST Act s.2(6), s.7(5)(a), s.10, s.12(2)(b), s.13, s.14, s.16; CGST s.24(i); Rule 46; CBIC Circular 242/36/2024; Notif 9/2025 & 15/2025-CT(R); Finance Act 2023 s.160; UAE Decree-Law 8/2017 Art 29/30/48; Executive Regs Art 23, 30, 31 (CD 100/2024), 41, 59 |
| Apps touched | db_changes / shared-library / server_1 / eatfit247-admin / eatfit247-web-1 |

## Context

EatFit247 sells diet-coaching **services** from India (EFMUM) and Dubai (HCUAE) and physical **goods** (debloat powder) from India (MEMUM). The owner asked for an audit of every combination of *franchise country × customer country × service-vs-goods* against current Indian GST and UAE VAT law (as of October 2026, rates from the 22 September 2025 "GST 2.0" change), a list of what development still misses, and the correct mapping the system must implement.

The gap analysis was measured against 4.6 (`feature/tax-engine-correctness`), which already fixes the pre-existing defects C2, C3, H6, H10, M2 and M4. What remains is mostly **data and classification**: no tax rule is seeded anywhere, goods rates are not tied to HSN or to the 22 Sep 2025 effective date, every plan shares one hardcoded rule reference, the place-of-supply State is not stored at decision time, and an unregistered franchise can still make inter-state goods supplies.

### Legal findings that drive this spec

**India (GST)**

| # | Rule | Basis |
|---|------|-------|
| IN-1 | B2C services: place of supply = recipient's State when an address is on record. Same State as franchise → CGST 9% + SGST 9%; other State → IGST 18%. | IGST s.12(2)(b) |
| IN-2 | For every online service sold through the supplier's own website/app to an unregistered person, the recipient's **State must be captured and printed on the invoice** regardless of value, and place of supply declared as that State. Penalty s.122(3)(e). | Circular 242/36/2024 (31 Dec 2024), Rule 46(f) proviso |
| IN-3 | B2C goods: place of supply = delivery address. | IGST s.10 |
| IN-4 | Diet/wellness coaching: **18%**, SAC 9993. The healthcare exemption needs a clinical establishment. The 5%-no-ITC slab (Group 99972: gyms, salons, yoga) does not clearly cover online diet consulting. | Notif 15/2025-CT(R) |
| IN-5 | Debloat powder: HSN 2106 "food preparations n.e.s." → **5%**; HSN 3004 Ayurvedic medicaments → **5%**, both from 22 Sep 2025 (12–18% before). | Notif 9/2025-CT(R) Sch. I |
| IN-6 | Export of service needs payment in convertible FX (or INR via RBI-permitted routes). Under a valid LUT → 0% with the Rule 46 endorsement; no LUT → IGST 18% + refund. Foreign customer paying INR over Indian rails → IGST 18%, not an export. | IGST s.2(6), s.7(5)(a), s.16; Circ. 202/14/2023 |
| IN-7 | Export of goods: zero-rated under LUT, decided by the goods leaving India; invoice and GSTR-1 6A need shipping-bill / CSB-V number, date and port. **Registration is mandatory for any inter-state or export supply regardless of turnover.** | IGST s.16; CGST s.24(i) |
| IN-8 | Foreign supplier → Indian consumer, online service = **OIDAR** since 1 Oct 2023 (human intervention no longer excludes it; "non-taxable online recipient" = any unregistered person). The foreign entity must register (REG-10), charge 18% IGST and file GSTR-5A from the first sale. | Finance Act 2023 s.160; IGST s.14 |
| IN-9 | Foreign supplier → Indian consumer, goods: BCD + IGST collected at customs from the buyer; the seller invoices 0%. | Customs Act |
| IN-10 | The intermediary deeming rule (s.13(8)(b)) was omitted from 30 Mar 2026. | Finance Act 2026 |

**UAE (VAT)**

| # | Rule | Basis |
|---|------|-------|
| AE-1 | 5% standard on goods and services supplied in the UAE; dietary supplements are standard-rated. | Decree-Law 8/2017 |
| AE-2 | Healthcare zero-rating applies only to licensed healthcare providers treating the patient. General wellness/diet coaching is **5%**. HCUAE's current 0% Z rule needs its legal basis recorded (licence) or must become 5% S. | ER Art 41 |
| AE-3 | Export of services to a customer outside the UAE = 0% Z when the customer has no UAE residence and is outside the UAE while the service is performed. Since 15 Nov 2024, **electronic services used or enjoyed in the UAE cannot be zero-rated**; evidence is the supplier's burden. | ER Art 31 (CD 100/2024) |
| AE-4 | Other GCC states are treated as non-implementing until the GCC electronic system is live → export, 0%. | FTA guidance |
| AE-5 | Export of goods: 0% if the goods leave the UAE within 90 days with official and commercial evidence. | ER Art 30 |
| AE-6 | Indian franchise → UAE consumer: B2C place of supply = supplier's residence → outside UAE VAT, **unless** the product is an *electronic service* (ER Art 23): then place of supply = UAE and the foreign supplier must register with **no threshold** and charge 5%. Human-delivered coaching → out of scope; a fully automated app plan → 5% + registration. | Decree-Law Art 29/30; ER Art 23 |
| AE-7 | Indian franchise → UAE customer, goods: 5% import VAT at UAE customs, not the seller's. | Art 48 |
| AE-8 | E-invoicing: voluntary 1 Jul 2026, mandatory 1 Jan 2027 (≥ AED 50M), all VAT-registered by 1 Jul 2027; B2C currently excluded. Line categories S/Z/E/O must be stored (already are). | FTA programme |

### The mapping table (what the engine must produce)

F = franchise, C = customer, SVC = service, GDS = goods. Engine result = `taxMode / taxCategory / rate / invoiceSeries`.

| # | F | C location | Type | Correct treatment | Engine result | Required data on invoice |
|---|---|-----------|------|-------------------|---------------|--------------------------|
| 1 | IN (EFMUM) | IN, same State | SVC | CGST 9% + SGST 9% | DOMESTIC_GST / – / 18 / DOMESTIC | C State name + code, SAC 999319, GSTIN |
| 2 | IN | IN, other State | SVC | IGST 18% | DOMESTIC_GST / – / 18 / DOMESTIC | same |
| 3 | IN (MEMUM, once registered) | IN, same State (delivery) | GDS | CGST 2.5% + SGST 2.5% | DOMESTIC_GST / – / 5 / DOMESTIC | delivery State, HSN per line |
| 4 | IN (MEMUM) | IN, other State | GDS | IGST 5% | DOMESTIC_GST / – / 5 / DOMESTIC | same |
| 5 | IN | outside IN, FX / Vostro / NRE-FCNR | SVC | Export of service, 0% under LUT | EXPORT_OF_SERVICE / – / 0 / EXPORT | LUT ARN + endorsement, C country, FX amount + INR at FBIL rate |
| 5b | IN | outside IN, FX, LUT expired | SVC | Export, IGST 18% paid | EXPORT_OF_SERVICE / – / 18 / EXPORT | "on payment of IGST" endorsement |
| 6 | IN | outside IN, INR on Indian rails | SVC | Not an export → IGST 18% | DOMESTIC_GST / – / 18 / DOMESTIC | C country; reason stored |
| 7 | IN | delivery outside IN | GDS | Export of goods, 0% under LUT (IGST if none) | EXPORT_OF_GOODS / – / 0 / EXPORT | shipping bill / CSB-V no. + date, port, destination (7.4) |
| 8 | AE (HCUAE) | AE | SVC | VAT 5% S, or 0% Z only with an Art 41 basis | VAT / STANDARD or ZERO_RATED / 5 or 0 / DOMESTIC | "TAX INVOICE", TRN, AED, category per line |
| 9 | AE | AE | GDS | VAT 5% S | VAT / STANDARD / 5 / DOMESTIC | same |
| 10 | AE | GCC or rest of world (not IN) | SVC | Export, 0% Z | VAT / ZERO_RATED / 0 / DOMESTIC | evidence C outside UAE; not Z if electronic and enjoyed in UAE |
| 11 | AE | outside AE | GDS | Export, 0% Z | VAT / ZERO_RATED / 0 / DOMESTIC | 90-day export evidence |
| 12 | AE | **IN** | SVC | OIDAR in India → **refused**; serve from EFMUM | 400 "Indian clients must be registered under the India franchise" | – |
| 13 | AE | IN | GDS | UAE export 0% Z; buyer pays BCD + IGST at Indian customs | VAT / ZERO_RATED / 0 / DOMESTIC | export docs |
| 14 | IN | AE, plan flagged *electronic service* | SVC | India: row 5/6. UAE: 5% + UAE registration for EFMUM | flag stored; treatment is an adviser decision; default = not electronic | – |
| 15 | IN (EFMUM) → AE (HCUAE) | B2B per-client fee | SVC | India export under LUT 0%; HCUAE self-accounts reverse charge | roadmap 7.1 | contract ref, HCUAE TRN |

### Gap register (after 4.6)

P0 = wrong tax or legal exposure on live rows; P1 = statutory data missing; P2 = robustness.

| ID | Sev | Gap | Rows | Handled by |
|----|-----|-----|------|-----------|
| G1 | P0 | No tax rules are seeded; every matrix row depends on hand-typed admin rows and a missing row is a 400 at checkout. | all | this spec, group 1 |
| G2 | P0 | Goods rate is not HSN-tagged or effective-dated; Mahi's rule charges 12% where the law is 5% from 22 Sep 2025. | 3, 4 | group 1 (`hsn_sac_code`, staged 5% rows) |
| G3 | P1 | All plans share `referenceId: 1` and one SAC from config; per-plan SAC/rate impossible without code. | 1, 2, 5, 6 | group 2 |
| G4 | P1 | Place-of-supply State is not stored at decision time; the invoice rebuilds it from the live address (Circular 242, principle 10). | 1–4 | group 2 |
| G5 | P1 | Unregistered Indian franchise can still make inter-state goods supplies (CGST s.24(i)). | 3, 4 | group 2 |
| G6 | P1 | HCUAE's AE service rule is 0% Z with no recorded legal basis; law default is 5% S. | 8 | group 1 (`legal_basis`), open question |
| G7 | P1 | No UAE zero-rating evidence capture (customer outside UAE during supply; electronic-service test). | 10, 11, 13 | deferred → roadmap 8.x |
| G8 | P1 | No electronic-service classification on plans (UAE Art 23, later EU/UK exposure). | 14 | group 1 (flag only) |
| G9 | P1 | Goods-export documents (shipping bill / CSB-V, port, IEC) not on the record. | 7 | deferred → 7.4 |
| G10 | P2 | Cross-border VAT branch uses the services note and "(billing address)" reason for goods. | 11, 13 | group 2 |
| G11 | P2 | Supply date localised in `Asia/Kolkata` for every franchise. | 8–13 | group 2 |
| G12 | P2 | `'IN'` / `'INR'` / `'AE'→'AED'` literals; `mst_countries` has no `currency_code`. | 14 | groups 1–2 |
| G13 | P2 | Foreign pseudo-states carry GST code `'1'` (collides with Jammu & Kashmir); no GST-code validation. | 1–4 | group 2 (guard only) |
| G14 | P2 | CGST = SGST = `taxAmount / 2`, unrounded; no single rounding policy. | 1, 3 | group 2 |
| G15 | P2 | Customer GSTIN/TRN ignored for place of supply and B2B particulars. | 1–4, 8 | deferred → 4.10 / 7.1 |
| G16 | P2 | No table-driven test pins the legal matrix. | all | group 3 |
| G17 | P2 | Dead tax config confuses admins (`mst_countries.tax_type`, `default_tax_percentage`, `international_tax_mode`, `lut_number`, `mst_product_prices.tax_percent`, `TAX_PERCENTAGE`). | – | group 4 (hide) |
| G18 | P2 | Website tax copy contradicts itself ("Inclusive of all taxes" vs "Taxes extra" vs FAQ). | 3–7 | group 5 |
| G19 | data | Goods invoices from 22 Sep 2025 to now may be over-taxed at 12%/18%. | 3, 4 | CA review + 4.9 credit notes |

Already correct in 4.6: rows 1, 2, 5, 5b, 6 service logic; row 7 delivery-country test; row 12 refusal; FX at issue; UAE "TAX INVOICE"/TRN/category lines; UAE credit notes; LUT register; export/domestic series.

## User Stories

- As **Accounts (India)**, I want every franchise's tax rules present from day one with their HSN/SAC and legal basis, so that a new environment or a new product never silently falls to a 400 or a wrong rate.
- As **Accounts (India)**, I want the customer's State stored on the payment at the moment tax is decided and printed from that stored value, so that the invoice meets Circular 242 and never changes when a member edits their address later.
- As **Finance**, I want the system to refuse an inter-state goods sale by an unregistered franchise, so that Mahi never issues an invoice the law does not allow.
- As **Super Admin**, I want to switch Mahi's product rules from "no tax" to 5% GST (and a plan to a different SAC/rate) by activating a configured row, not by a deployment.
- As **Accounts (UAE)**, I want the legal basis of HCUAE's zero-rated rule visible on the rule, so that an FTA query can be answered from the record.
- As **Engineering**, I want one table-driven test that pins every row of the mapping table, so that a rule-engine change that breaks a legal case fails CI.

## Scope

**In scope**
- Migration 144: `mst_tax_master.hsn_sac_code`, `legal_basis`; `mst_program_plan.is_electronic_service`; `mst_countries.currency_code`; place-of-supply columns on payments and order items; seeded rules for EFMUM, HCUAE and MEMUM (guarded `INSERT … WHERE NOT EXISTS`).
- Engine: per-plan rule reference with fallback; stored place of supply (country + State code); unregistered inter-state goods guard; goods-aware cross-border VAT note; franchise time zone for the supply date; functional currency from the country master; rounding policy.
- Table-driven matrix test covering rows 1–14 and their variants.
- Admin: HSN/SAC + legal basis on the tax-master form/list; electronic-service toggle on plans; deprecated fields hidden.
- Website: one tax statement driven by the server; Circular 242 hint on the State field.
- Roadmap 4.11 split; mission markets table updated.

**Out of scope**
- UAE zero-rating evidence capture (G7), goods-export documents (G9), customer GSTIN/TRN logic (G15), OIDAR support for HCUAE, foreign shipping/currency for products on the website, correcting already-issued invoices (G19), EU/UK VAT.

## Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **Baseline is 4.6.** Gaps are measured against `feature/tax-engine-correctness`; the branch stacks on it. | Owner decision 2026-10-10. 4.6 already fixes the audit's engine defects; re-listing them would hide the real remaining work. |
| 2 | **Diet consultation stays 18%, SAC 999319** until the CA rules on 99972/5%. | Owner decision. Conservative reading; the rule row is effective-dated so a CA change is a config edit. |
| 3 | **Indian clients under a non-Indian franchise stay refused** (no OIDAR registration for HCUAE). | Owner decision; 4.6 decision 6. |
| 4 | **Seeds never overwrite admin-edited rows.** `INSERT … WHERE NOT EXISTS` per franchise + reference + country + type (any existing row, active or not, suppresses the seed; the staged MEMUM 5% row is suppressed only by an existing 5% GST row); re-running 144 is a no-op. | Rules are owner data; a migration must not reset a CA-driven change. |
| 5 | **MEMUM is seeded as `NONE` (active) plus a staged, inactive GST 5% row per product** (HSN from the product, effective 2025-09-22). | Mahi is unregistered today (4.6 decision 18). The CA's answer becomes "activate the staged row", not a deployment. |
| 6 | **HCUAE AE service rule stays 0% ZERO_RATED** with `legal_basis` = "Art 41 ER healthcare zero-rating per UAE adviser; confirm licence, else 5% STANDARD". | Keeps 4.6 decision 7 while making the basis auditable (G6). |
| 7 | **Place of supply is stored at decision time** (`place_of_supply_country_code`, `place_of_supply_state_code`) and the invoice prints the stored value; the address-derived value is only a fallback for pre-144 rows. | Circular 242 and principle 10. |
| 8 | **Unregistered Indian franchise + delivery State ≠ supplier State (or unknown) → 400**, with config `ALLOW_UNREGISTERED_INTERSTATE_GOODS` (default false) as the CA override; `mst_configs` is read at boot, so the override needs an API restart. Goods only: Notif 10/2017-IT exempts under-threshold inter-state *service* suppliers from s.24(i). | CGST s.24(i). Sales must not continue illegally by default, but the CA may accept the risk explicitly. |
| 9 | **Plans pass their own `programPlanId` as the rule reference; the lookup falls back to `reference_id = 1`.** | G3 without a data migration: the single EFMUM row keeps working; a plan-specific row wins when present. |
| 10 | **`is_electronic_service` is a stored flag only.** No engine branch reads it yet. | AE-6 needs an adviser decision; capturing the classification now avoids a second data pass. |
| 11 | **Rounding:** per line to 2 dp; CGST = round(tax/2), SGST = tax − CGST. | Audit M3; totals must equal the sum of the printed lines. |
| 12 | **Functional currency comes from `mst_countries.currency_code`**, not an `'AE'→'AED'` literal. | G12; a third franchise country must be configuration. |

## Technical Constraints

- **Data:** `db_changes/144_tax_mapping_matrix.sql` (idempotent, transactional; `ADD COLUMN IF NOT EXISTS`; seeds guarded). Audit columns on nothing new (only columns, no new tables). Soft delete unchanged.
- **Contract:** `ITaxMaster.hsnSacCode`, `legalBasis`; `ICalculateTaxResponse.placeOfSupplyCountryCode`, `placeOfSupplyStateCode`; `IProgramPlan.isElectronicService`; `ICountry.currencyCode`.
- **API:** no new endpoints. Tax-master, program-plan and country DTOs gain the new fields. Tax previews return the stored place-of-supply codes.
- **RBAC:** none new (existing TaxMaster, ProgramPlan, Country subjects).
- **Money:** tax decided and stored at payment (principle 1); no change to issued invoices (principle 10); series logic unchanged.
- **Async:** none.

## Principle Check

| Principle | How this feature respects it |
|---|---|
| 1 Tax at payment | Place of supply joins the stored decision; invoices render it from storage. |
| 2 No invoice gaps | Untouched. |
| 3 Franchise isolation | Seeds are per franchise; no cross-franchise reads added. |
| 5 Permissions in data | No role checks in code. |
| 6 Soft delete | Staged rules use `active`; nothing is deleted. |
| 8 One contract | New fields in shared-library. |
| 9 Automated proof | Matrix spec pins every legal row. |
| 10 Issued invoices immutable | Stored place of supply removes the last print-time recomputation of a tax particular. |
| 11 Server owns money state | Unchanged. |

## Open Questions

- [ ] **[CA]** SAC and rate for diet consultation: 999319 @ 18% (current) or 99972 @ 5% without ITC? (Default stays 18%, decision 2.)
- [ ] **[CA]** HSN for the debloat powder: 2106 (food supplement) or 3004 (AYUSH)? Both 5% since 22 Sep 2025; the staged row uses the product's current `hsn_code`.
- [ ] **[CA, urgent]** Mahi's GST registration. Until registered, inter-state and export goods sales are refused (decision 8).
- [ ] **[CA]** Do Razorpay INR-denominated international-card payments with an e-FIRA count as export proceeds? (Carried from 4.6.)
- [ ] **[CA]** Goods invoices issued 22 Sep 2025 → now at 12%/18%: credit notes (4.9) or leave as filed? (G19)
- [ ] **[UAE adviser]** Basis for HCUAE's 0% Z on UAE clients (Art 41 licence?) or switch to 5% S (decision 6).
- [ ] **[UAE adviser]** Is EatFit247's online coaching an *electronic service* under ER Art 23 when sold to UAE residents by EFMUM? (Row 14, decision 10.)
- [ ] **[UAE adviser]** Zero-rating evidence policy for HCUAE's foreign clients (G7).
