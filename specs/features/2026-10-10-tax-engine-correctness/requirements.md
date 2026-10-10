# Requirements: Tax-Engine Correctness (India export, UAE VAT, FX, UAE Tax Credit Notes)

| Field | Value |
|-------|-------|
| Status | Approved, **implementation deferred** (owner, 2026-10-10): starts after the invoice-number spec ([2026-10-10-invoice-number-non-gst](../2026-10-10-invoice-number-non-gst/), roadmap 4.7) is merged and closed. All pending work is in [plan.md](./plan.md) groups 1–11 |
| Branch | `feature/tax-engine-correctness` (stacked on `feature/10-10-2026-checkout-lockdown`; retarget to `m3-cms-update` once 4.5 is merged) |
| Roadmap | Phase 4: **4.6** Tax-engine correctness (P0). **Absorbs 8.0** (UAE VAT for HCUAE) and the exchange-rate part of **4.10**, by owner decision 2026-10-10 |
| References | [Accounting audit](../../backlog/2026-10-10-accounting-audit.md) C2, C3 (done in 4.5), H6, H9, H10, M2, M4, part of H1; IGST Act s.2(6), s.7(5)(a), s.13, s.14, s.16; CGST Rules 34, 46, 96A; CBIC Circular 202/14/2023; UAE VAT Decree-Law Art 69, ER Art 31, 41, 59, 60 |
| Apps touched | shared-library / server_1 / eatfit247-admin / eatfit247-web-1 / db_changes |
| Depends on | 4.5 checkout lockdown (same files; stacked branch) |
| Blocks | 4.7 invoice series picks the export series from the tax mode saved here. **Order swapped by the owner:** 4.7 ships first (Q2 FY 2026-27 filing). Until 4.6 ships, new foreign-client payments still save `NO_TAX`, so 4.7 must classify them by billing country, or Accounts must review the export series by hand |

## Context

The tax engine decides tax at payment time and saves it on the payment (principle 1), but it gets three cross-border cases wrong:

1. **Foreign client of the India franchise (EFMUM, MEMUM).** The export branch can never run (audit C2). The rule is looked up by the buyer's country, and the export test then needs the rule's country to be India and the buyer's country not to be India at the same time. Foreign clients get `NO_TAX` ("No Tax Applicable", no LUT endorsement), or IGST if someone adds a rule for their country. Member 4945 (United States) shows this: payments 5125 and 5128 are INR, `NO_TAX`, numbered in the domestic series.
2. **UAE client of the UAE franchise (HCUAE).** HCUAE is VAT-registered and its configured rate for UAE clients is 0%. The engine turns any 0% rule into `NONE`/`NO_TAX`, so the invoice is a plain "INVOICE" with no TRN and no VAT category (audit H6). Foreign clients of HCUAE also get `NO_TAX`; under UAE VAT they are zero-rated exports.
3. **Indian client of the UAE franchise.** Since 1 Oct 2023, online services sold from abroad to an unregistered Indian individual are OIDAR. The foreign supplier would owe 18% IGST and need a simplified Indian GST registration (REG-10). **Owner decision: Indian clients are always served by the India franchise.** Today nothing stops a UAE-franchise member from having an Indian billing address (member 5889, payment 5127, 0%).

Other gaps in the same code path:
- **Foreign clients paying in INR (audit H10).** A sale is an export only when the money arrives in foreign currency, or in INR through a route the RBI allows (CBIC Circular 202/14/2023: Special Rupee Vostro accounts). UPI, Indian cards, Indian net banking and NRO accounts don't qualify. Such a sale is still an inter-state supply (IGST s.7(5)(a)), so it's taxed 18% IGST, not 0%.
- **LUT (audit M4).** The franchise has one free-text `lut_number` that the engine never reads. There are no validity dates, and the invoice never prints the ARN.
- **Missing addresses (audit M2).** A missing state silently gives IGST, a missing billing address gives `NO_TAX`, and a missing franchise address crashes.
- **Exchange rates (audit H9).** No rate is saved per invoice. Indian returns need INR values for foreign-currency exports (Rule 34). UAE tax invoices in another currency need AED totals at the UAE Central Bank rate (Art 69).
- **UAE Tax Credit Notes.** There's no way to correct a UAE tax invoice. ER Art 60 requires a Tax Credit Note.

How other businesses handle the INR question: tax is fixed before the client pays, but the payment method is only known afterwards. So they decide by the **currency of the order**. Foreign clients see foreign-currency prices. A non-INR Razorpay order can only be paid by international card or PayPal, and Razorpay (RBI cross-border licence, Dec 2025) issues an e-FIRA, so it's export proceeds. INR orders may be paid over domestic rails, so they get IGST.

## User Stories

- As **Accounts (India)**, I want a foreign client who pays in foreign currency to get a 0% export invoice with the LUT ARN and the Rule 46 endorsement, so that exports are zero-rated and reported correctly.
- As **Accounts (India)**, I want a foreign client who pays in INR over Indian payment methods to be charged 18% IGST, so that we don't zero-rate a sale that doesn't qualify as an export.
- As **Accounts (India)**, I want an export with no valid LUT to still go through, with IGST charged and the "on payment of integrated tax" endorsement, so that sales never stop and the IGST can be claimed back.
- As **Finance**, I want to record the payment route and FIRC/e-FIRA reference on an offline payment, so that each export can be proved.
- As **Accounts (UAE)**, I want HCUAE invoices to be "Tax Invoice"s with the TRN, the VAT category and rate per line, and AED totals, so that they meet UAE VAT rules.
- As **Accounts (UAE)**, I want to issue a Tax Credit Note against a UAE tax invoice, so that corrections and refunds follow ER Art 60.
- As **Super Admin**, I want UAE and Indian rates to come from tax rules configured per franchise, country and transaction type, so that a rate change is a configuration change, not a deployment.
- As **Operations**, I want the system to refuse to bill an Indian client under the UAE franchise, with a clear message, so that we never owe Indian IGST from the UAE entity.
- As **Finance**, I want exchange rates fetched daily from official sources and saved on each invoice, so that INR and AED values are available for filing.

## Scope

**In scope**

*Tax decision (server)*
- **Domestic vs export by supplier country vs customer country** (principle 1). The supplier country comes from the franchise address; a missing one is a clear error, not a crash.
- **India franchise, services, foreign customer:**
  - A **non-INR** order, or an offline payment whose route is foreign (SWIFT/FIRC, international card gateway, Rupee Vostro), is an **export of service**.
  - With a valid LUT on the supply date: 0%, `is_lut_applied = true`, LUT ARN saved.
  - Without a valid LUT: 18% IGST, export endorsement "on payment of integrated tax".
  - An **INR** order on a domestic route is **18% IGST** (not an export), with the reason saved.
- **India franchise, goods (MEMUM), foreign delivery address:** export of goods (`EXPORT_OF_GOODS`), 0% under LUT, or IGST without one. The test uses the **delivery (shipping) country**, and currency doesn't matter. Goods zero-rating depends on the goods leaving India; FEMA realisation is reported separately.
- **India franchise, Indian customer:** unchanged rules (CGST+SGST when the states match, else IGST). A billing state is now **required**, and a missing state is an error, not silent IGST.
- **Indian customer under a non-Indian franchise is refused**, with a clear message (admin create/update, product orders, public checkout). *(A warning on the admin member form is deferred: the payment-time refusal already blocks every such sale.)*
- **UAE franchise (VAT):**
  - **UAE customer:** the franchise's AE rule for that transaction type gives the rate and **VAT category** (S standard / Z zero-rated / E exempt / O out of scope). Today that rule is 0%, category Z. A 0% rule is saved as **VAT 0%**, never `NONE`.
  - **Customer outside the UAE:** zero-rated export of service (Z, 0%) when the franchise is VAT-registered. The reason ("recipient outside the UAE, per billing address") is saved as the evidence note.
- **Tax rules come only from configuration.** `mst_tax_master` rows per franchise, country and transaction type (and reference) give the domestic rate and category.
  - The lookup filters on `active` and `transaction_type`, takes the newest matching `effective_from`, and trims `CHAR(3)` padding.
  - A **missing rule is an error** naming the franchise, country and type, not a silent `NO_TAX`.
  - "Not registered / no tax" is configured explicitly as a `NONE` rule.
- **Every payment and order line saves its decision:** tax mode, VAT category, payment route, LUT ARN, place of supply / country of destination, and a short decision reason.

*LUT register*
- New per-franchise register: ARN, financial year, valid from/to, active. Admin CRUD under the franchise (RBAC-seeded). Shows an "expires soon / expired" warning.

*Payment route*
- `payment_route` on plan payments and product orders: DOMESTIC, INTERNATIONAL_CARD_GATEWAY, FOREIGN_REMITTANCE (SWIFT with FIRC), RUPEE_VOSTRO, NRE_FCNR_ACCOUNT (debit to the buyer's NRE or FCNR account).
- The server sets it for gateway records (non-INR → international card gateway; INR → domestic).
- The admin picks it for offline payments and enters the FIRC/e-FIRA reference.
- NRE/FCNR debits count as export proceeds (owner decision, FEMA receipt-and-payment regulations). NRO debits are DOMESTIC.

*Website checkout*
- For a billing country outside India, the summary uses the plan's **foreign-currency fee** when one exists, so the order is an export.
- Otherwise it falls back to INR with IGST shown in the summary.
- The summary shows the tax label the server decided.

*Admin*
- Payment and product forms gain payment route + remittance reference (for foreign clients of Indian franchises).
- The tax preview shows the decision and its reason (e.g. "Export under LUT AD270326000123X", "IGST 18%: INR payment by foreign client", "LUT expired: export with IGST").
- Franchise form: TRN label for VAT franchises, LUT register tab.
- Tax-master form: VAT category, `NONE` rules, product references.

*Invoices (rendering only stored values)*
- **Indian exports:**
  - the exact Rule 46 endorsement ("SUPPLY MEANT FOR EXPORT UNDER BOND OR LETTER OF UNDERTAKING WITHOUT PAYMENT OF INTEGRATED TAX", or "… ON PAYMENT OF INTEGRATED TAX")
  - the LUT ARN and FY
  - the country of destination and place of supply
  - the INR value and exchange rate for foreign-currency invoices
- **The supplier tax ID is printed whenever the franchise is registered** (GSTIN for EFMUM, TRN for HCUAE). An unregistered franchise prints none and never shows a tax line.
- **UAE:**
  - "TAX INVOICE" with the TRN
  - VAT category, rate and amount per line
  - AED totals and the rate for non-AED invoices
  - amount in words in the invoice currency (no "Rupees/Paise" on AED or USD)

*Exchange rates*
- A rate table filled by a **daily job from official free sources**: FBIL reference rates (published for the RBI) for INR on services, and UAE Central Bank daily rates for AED.
- **CBIC customs rates for goods** are entered by Finance twice a month (no free API).
- Manual override for any day.
- At invoice issue, the rate, rate date and source are saved, with INR/AED equivalents of the total and tax. The rule is the latest published rate on or before the supply date.
- If no rate exists yet, the invoice still issues, flagged "FX pending", and the daily job backfills it.

*UAE Tax Credit Notes*
- Admin issues a Tax Credit Note against an issued tax invoice of a VAT franchise:
  - with a reason, an amount up to what is still creditable, and VAT reversed at the original rate and category
  - with AED values at the original invoice's exchange rate
- Own gap-free series per franchise and FY (`{code}/{FY}/CN/{seq}`).
- PDF titled "TAX CREDIT NOTE" referencing the original invoice number and date.
- RBAC-seeded admin action; a warning when issued more than 14 days after the event date.

**Out of scope**
- **Correcting tax on already-issued invoices** (5125–5128 and production history): a CA decision. Corrections go through credit notes (UAE now, India in 4.9).
- **Indian (GST) credit and debit notes**, receipt and refund vouchers, and refund/RTO triggers: roadmap **4.9**. It reuses the credit-note engine built here.
- **Separate export invoice series** and proforma: roadmap **4.7**, which depends on this feature.
- **Invoice immutability / frozen snapshot:** 4.8.
- **Remaining Rule 46 particulars:** amount in words for INR, per-line CGST/SGST/IGST split, unit of quantity, and the reverse-charge line stay in **4.10**. SAC/HSN and rate master stay in 4.11.
- **Explicit seller entity** (gateway franchise chosen alphabetically, products always MEMUM): **4.12**.
- **GSTR-1 / VAT-201 extracts:** 4.13. EDF extract and export-realisation ageing: later.
- **UAE sales of goods** (HCUAE sells only diet consultancy today). If it ever does, that's a new AE `PRODUCT` tax rule, which is configuration only.
- **UAE e-invoicing (ASP)** readiness: tracked on the roadmap, no code.
- **OIDAR registration for HCUAE:** not needed, because Indian clients go to EFMUM.

## Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **Domestic vs export = supplier country ≠ customer country.** The domestic rate comes from the franchise's own-country rule; the export treatment comes from the supplier's tax system (India GST → export of service/goods; UAE VAT → zero-rated export). Foreign-country tax rules are no longer needed. | Principle 1, and audit C2's fix ("use the franchise's own IN rule"). It removes the contradictory export test. |
| 2 | **Services are exports only when the money is foreign.** A non-INR order, or an offline payment with route INTERNATIONAL_CARD_GATEWAY / FOREIGN_REMITTANCE / RUPEE_VOSTRO / NRE_FCNR_ACCOUNT, is an export. INR on DOMESTIC (including NRO debits) is 18% IGST. | IGST s.2(6)(iv), CBIC Circular 202/14/2023, s.7(5)(a). NRE/FCNR: owner decision 2026-10-10 (RBI permits export proceeds by debit to the buyer's NRE/FCNR account; NRO funds are not freely repatriable). The order currency is known before payment; a non-INR Razorpay order can only be paid from abroad. Owner chose "currency + payment route". |
| 3 | **Goods exports are decided by the delivery country**, not currency or route. | The place of supply for goods is where they're delivered; zero-rating needs the goods to leave India. FEMA realisation is separate (later). |
| 4 | **No valid LUT on the supply date → export with 18% IGST** and the "ON PAYMENT OF INTEGRATED TAX" endorsement; admins see a warning. | Owner decision. Sales never stop and the IGST can be refunded (s.16). Blocking would stop website sales abroad. |
| 5 | **LUT register** `mst_franchise_luts` (ARN, FY, valid_from, valid_to). The ARN valid on the supply date is saved on the payment. `mst_franchises.lut_number` is no longer read. | Audit M4: an LUT is valid for one FY, and the invoice must show which one applied. |
| 6 | **Indian customers are always served by the India franchise.** A billing country of IN with a non-IN franchise is refused in every tax path, with "Indian clients must be registered under the India franchise". (Member-form warning deferred.) | Owner decision. It avoids OIDAR IGST and a REG-10 registration for HCUAE. |
| 7 | **VAT category on the tax rule.** `mst_tax_master.tax_category` = STANDARD / ZERO_RATED / EXEMPT / OUT_OF_SCOPE (default STANDARD). A VAT rule at 0% must be ZERO_RATED or EXEMPT. HCUAE's AE service rule is 0% ZERO_RATED. A 0% VAT rule is saved as VAT 0%, never `NONE`. | Owner: UAE treatment is configuration ("a tax row per country, franchise and type of service"). UAE invoices need S/Z/E/O per line (ER Art 59), and Z and E are reported differently. |
| 8 | **A missing tax rule is an error**, and "no tax" must be an explicit `NONE` rule. The lookup filters `active` and `transaction_type`, orders by `effective_from DESC`, and trims the `CHAR(3)` country. | Silent `NO_TAX` is how C2 and M2 hid. The current lookup can pick an inactive or wrong-type rule at random. |
| 9 | **Billing country and state are required before any tax calculation** (and the delivery country for goods). Missing data is a 400 with a message, never a guess. | Audit M2; Rule 46(e). |
| 10 | **New tax mode `EXPORT_OF_GOODS`.** `EXPORT_OF_SERVICE` and `EXPORT_OF_GOODS` cover both the LUT (0%) and IGST-paid cases; `is_lut_applied` tells them apart. UAE uses tax mode `VAT` plus the saved category. | 4.7 decision 1 chooses the export series from the tax mode, and both LUT and IGST-paid exports belong in the export series. |
| 11 | **`payment_route` and `remittance_reference` on payments and product orders.** The server sets the route for gateway records; the admin picks it for offline ones. The route is part of the tax decision, so changing it re-prices an unissued record and is blocked on issued ones (amount lock from 4.5). | Audit H10: the route decides export status, and FIRC/e-FIRA is the proof. |
| 12 | **The website uses the plan's foreign-currency fee for billing countries outside India** when one exists, else INR + IGST. There's no currency picker. | Turns foreign clients into exports online without a UI change. Plans have only INR fees today, so Finance must add USD fees (owner task). |
| 13 | **Exchange rates: a daily job fetches FBIL** (INR reference rates, for services; Rule 34(2) GAAP rate) **and the UAE Central Bank** (AED; Art 69), directly from their official sites (decision 19). **CBIC customs rates for goods** (Rule 34(1)) are entered by Finance twice a month. Any day can be overridden manually; the source is saved per rate. | Owner: auto-fetch, but only from free sources the authorities accept. The customs rate has no free API. |
| 14 | **The rate is fixed at invoice issue** (the latest published rate on or before the supply date) and saved with the date and source, plus the INR/AED total and tax. With no rate, the invoice issues with "FX pending" and the job backfills it. | Principle 1 (render only stored values). A PAID webhook must never fail because a rate feed is down. |
| 15 | **UAE Tax Credit Notes are in this feature** (owner decision). The engine is generic (series, link to the original, proportional tax reversal, PDF), but 4.6 enables it only for VAT franchises; India GST credit notes come in 4.9 on the same engine. | Owner moved UAE credit notes forward. A shared engine avoids building it twice. |
| 16 | **One spec, many groups**, on a branch stacked on 4.5. | Owner decision. Each group is built, tested, reviewed and committed before the next. |
| 17 | **Already-issued invoices are not recalculated.** Test payments 5125–5128 stay as issued. | Principle 10 / CA decision. Corrections are credit notes. |
| 18 | **Tax rules must match the franchise's registration.** A GST rule needs a GSTIN on the franchise; a VAT rule needs a TRN. An unregistered franchise may only have `NONE` rules (plain "INVOICE", no tax line, no tax ID). Export of goods/services under LUT needs a GSTIN. Saving an inconsistent rule is refused, and the engine re-checks at payment. | Owner data: EFMUM is GST-registered (`27CSEPS5397E1Z8`); Mahi is not registered; HCUAE is VAT-registered (TRN). Today all three carry EFMUM's GSTIN in local data, and Mahi's rule charges GST 12%. |
| 19 | **Exchange rates come only from the official publishers**: FBIL ([fbil.org.in](https://www.fbil.org.in), the RBI-designated reference rate) for INR, fetched daily; for AED, the UAE Central Bank's official USD peg (3.6725) and, for other pairs, rates Finance enters from [centralbank.ae](https://www.centralbank.ae/en/forex-eibor/exchange-rates/) (its site blocks automated fetching). No third-party aggregators. If a fetch fails, Finance enters the rate by hand from the same official page (source MANUAL, with a note). | Owner: free, valid and trusted for both countries. Rule 34(2) GAAP rate for services; UAE Art 69 requires the Central Bank rate. |

## Technical Constraints

- **Data** (next free numbers; 137/138 are reserved by 4.7, 139 is 4.5):
  - `140_tax_engine_correctness.sql`:
    - `tax_mode` + `EXPORT_OF_GOODS`
    - `mst_tax_master.tax_category`
    - `mst_franchise_luts`
    - `payment_route` enum + `payment_route`, `remittance_reference` on `txn_member_payments` / `txn_member_products`
    - `tax_category`, `lut_arn`, `tax_decision_reason` on payments and order items
    - an `invoice_note` model attribute for payments (exists in the DB, missing in the model)
    - backfill HCUAE's AE rule as ZERO_RATED
  - `141_exchange_rates.sql`: `mst_exchange_rates` (rate_date, from/to currency, rate, source FBIL / CBUAE / CBIC_CUSTOMS / MANUAL, unique per date + pair + source), plus FX columns on payments and products (`fx_rate`, `fx_rate_date`, `fx_source`, `functional_currency`, `functional_total_amount`, `functional_tax_amount`). It replaces the unused `mst_currency_configs`.
  - `142_credit_notes.sql`: `txn_credit_notes` + `txn_credit_note_items`, credit-note sequences, RBAC subjects.
  - All new tables carry audit columns, soft delete and idempotent DDL.
- **Contract:** in shared-library:
  - enums `TaxCategoryEnum`, `PaymentRouteEnum`, `ExchangeRateSourceEnum`, and `TaxMode.EXPORT_OF_GOODS`
  - interfaces for LUT, exchange rate and credit note, plus the decision fields on the tax-calculation and payment interfaces
  - invoice-mapper changes
- **API:**
  - admin CRUD: LUT register, exchange rates (list / manual / customs), credit notes (create, list, PDF)
  - changed: tax preview responses carry the decision reason
  - public: the checkout tax/summary returns the server-decided label and currency
  - all wrapped in `IResponse<T>`
- **RBAC:** new subjects for LUT register, exchange rates and credit notes are seeded in `mst_admin_role_subject_permissions` by migration and franchise-scoped (principle 3/5).
- **Money:**
  - tax decided and saved at payment (principle 1)
  - credit notes use their own gap-free series (principle 2)
  - FX saved at issue
  - no change to issued invoices
- **Async:** a daily `@nestjs/schedule` job fetches rates (idempotent upserts) and backfills "FX pending" invoices. Feed failures are logged and alerted, never thrown into payment paths.

## Principle Check

| Principle | How this feature respects it |
|---|---|
| 1 Tax at payment | Decided and saved at payment, including the reason, route, LUT ARN and FX. Invoices render only stored values. Domestic vs export uses supplier vs customer country. |
| 2 No invoice gaps | Credit notes have their own row-locked sequence, issued only on save. The invoice series split is 4.7. |
| 3 Franchise isolation | New admin endpoints are franchise-scoped in the service and in CASL. |
| 4 Nutritionists cross franchises | Unchanged. |
| 5 Permissions in data | New subjects seeded in the DB; no role checks in code. |
| 6 Soft delete | LUT, rate and credit-note rows use `active = false`; credit notes are never deleted (cancelled by a new document in 4.9). |
| 7 Ordered journey | Unchanged. |
| 8 One contract | New enums and interfaces in shared-library. |
| 9 Automated proof | Unit test matrix for the tax decision (every country / route / LUT / category case), FX selection and credit-note math. Integration and e2e follow when the Phase 5 harness exists. |
| 10 Issued invoices immutable | No recalculation of issued invoices; corrections via Tax Credit Notes. |
| 11 Server owns money state | The route for gateway records is set by the server, and the public checkout can't send a route or currency override beyond picking an existing plan fee. |

## Open Questions

- [x] **[CA]** NRE-account payments: **yes, export proceeds** (NRE and FCNR debits; NRO no). Owner answer 2026-10-10 → decision 2.
- [ ] **[CA]** Do Razorpay **INR-denominated** international-card payments with an e-FIRA count as export? Until answered, every INR gateway order is domestic, per decision 2.
- [x] **[UAE adviser]** HCUAE's AE service rule is **zero-rated (Z)**. If the adviser changes their view, it's a tax-rule config change (decision 7).
- [ ] **[Owner]** HCUAE's actual **TRN** (15 digits, from its FTA registration certificate), to replace the GSTIN on the franchise.
- [x] **[Finance]** Plans will get **USD fees** for foreign clients (decision 12).
- [x] **[Data]** `27CSEPS5397E1Z8` belongs to **EFMUM only**. HCUAE gets its TRN; Mahi has no GSTIN (decision 18). Production franchise data is corrected through the admin franchise form in group 11, not by migration.
- [ ] **[CA, urgent]** **Mahi's GST registration.** Mahi isn't registered (turnover under the threshold), but the ₹40 lakh threshold for goods covers only intra-state supplies. Shipping powder to other states, or abroad, is an inter-state supply, which needs GST registration whatever the turnover (CGST s.24(i)). Also, an LUT can only be filed by a registered person. Meanwhile Mahi's tax rule charges GST 12% and its invoices print EFMUM's GSTIN. The system will follow whichever answer the CA gives (register → GST rules + LUT; stay unregistered → `NONE` rules, and the CA decides whether out-of-state and export orders may continue).
- [x] **[Spike, group 9, 2026-10-10]**
  - **FBIL:** public JSON API `GET https://www.fbil.org.in/wasdm/refrates/fetchfiltered?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD&authenticated=false` returns the daily reference rates (13:00 IST, business days) for **INR per 1 USD, 1 GBP, 1 EUR and per 100 JPY**. Fetched daily.
  - **UAE Central Bank:** the rates page is behind a Cloudflare bot challenge, so it can't be fetched automatically (bypassing bot detection is not acceptable). The AED is **officially pegged to the USD at 3.6725** by the Central Bank, so USD↔AED uses that fixed official rate (source `CBUAE_PEG`). Any other AED pair is entered by Finance from the Central Bank page (source `MANUAL`).
  - Pairs FBIL doesn't publish (e.g. AED↔INR) are not needed today: Indian franchises invoice in INR or USD, HCUAE in AED or USD. If one appears, the invoice issues "FX pending" until Finance enters the rate.
