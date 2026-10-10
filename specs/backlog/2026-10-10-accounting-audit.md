# Accounting and Tax Compliance Audit: EatFit247 v2 Platform

> **Date:** 2026-10-10
> **Type:** external-auditor-style review of the system, not a statutory audit
> **Scope:** invoicing, tax, payments and reporting for all three entities, under Indian GST/FEMA/income-tax law and UAE VAT/corporate-tax law
> **Method:** read-only code review of `server_1`, `shared-library`, `eatfit247-admin` and `db_changes`, plus a legal-requirements checklist built from official and reputable sources (listed at the end)
>
> ⚠️ This is **not legal or tax advice**. Items marked **[CA]** need a Chartered Accountant / UAE tax adviser decision. Items marked **[verify]** come from secondary sources or describe changes after mid-2025; confirm them against the official text before acting.
>
> Verification: findings marked ✔ were re-checked in code by the lead reviewer. No production data was queried (the local DB was offline), so data-dependent effects are stated as "likely".

## 1. Entities and flows audited

| Entity | Code | Business | Customers | Tax regime |
|---|---|---|---|---|
| EAT FIT 247 | EFMUM (id 1) | Diet consultation (services) | B2C India + abroad | Indian GST; export of services under LUT |
| Mahi Enterprise | MEMUM (id 3) | Debloat powder (goods), courier delivery | B2C India + abroad | Indian GST; export of goods |
| Healuxe Consulting FZE | HCUAE (id 2) | Diet consultation (UAE free zone) | B2C UAE + worldwide | UAE VAT 5% / 0%; UAE corporate tax |
| EFMUM → HCUAE | — | EatFit247 nutritionists coach HCUAE clients; HCUAE pays a fee per client | B2B cross-border | India: export of service. UAE: reverse charge |

## 2. Executive summary

The platform has good foundations:
- tax is calculated and stored at payment time
- invoice numbers come from a row-locked sequence
- address snapshots are kept with each payment
- there are no hard deletes of transactions in code

However, **six critical issues mean some invoices issued today are likely wrong or unsupported**:

1. **C1 Invoices can be issued without payment.** The public checkout accepts `paymentStatusId=PAID` and `paymentSource=MANUAL` from the browser. ✔
2. **C2 EatFit247's export (LUT) logic never runs.** Foreign clients are invoiced as "No Tax", with no LUT endorsement and no export classification. ✔
3. **C3 Mahi's product tax swaps the supplier and the customer.** Foreign buyers of the powder are charged Indian GST, and the stored place of supply is inverted. ✔
4. **C4 Issued invoices can be silently changed.** Paid, invoiced payments are fully editable with no history, and every PDF is re-rendered from current data. This breaches GST record rules (Rule 56(8)) and the Companies Act audit trail, if the entity is a company.
5. **C5 There are no credit notes, receipt vouchers or refund vouchers.** Refunds are stored as a JSON blob only.
6. **C6 Invoice numbers are longer than 16 characters (Rule 46(b)).** The owner has accepted this risk, but it is still a finding.

**Consequence for the in-flight separate-export-series feature (was 4.1, now roadmap 4.7):** because of C2 and C3, stored `tax_mode` for foreign clients is most likely `NO_TAX` (services) or `DOMESTIC_GST` (products), **not** `EXPORT_OF_SERVICE`. As written, the spec's series rule would put no foreign client into the EXP series. See §6.

## 3. Findings

Severity: **Critical** = wrong tax or invoice is being issued, or there is fraud exposure. **High** = statutory non-compliance or a material reporting gap. **Medium** = control weakness. **Low** = hygiene.

### Critical

| ID | Entity | Finding | Evidence | Law / impact | Recommendation |
|---|---|---|---|---|---|
| C1 ✔ | EFMUM, HCUAE | **Public checkout trusts client-supplied payment state.** `CreatePublicCheckoutPlanOrderDto` accepts `paymentStatusId`, `paymentSource`, `paymentDate`, `transactionId` and `discountAmount` (`@Min(0)`, with no maximum). `create()` issues an invoice number when the status is PAID. | `checkout-plan.controller.ts:117-127`, `public-checkout.dto.ts:127-153`, `member-plan.service.ts:422-434` | Anyone with a checkout token can create a "PAID" plan with an invoice and a diet-plan entitlement, and no money. GST becomes payable on a fictitious invoice. Fraud and revenue risk. | **P0.** On public routes, force PENDING and PAYMENT_GATEWAY on the server, set the date on the server, ignore client discounts, and validate `promoCode` against `txn_promo_codes`. Only the webhook may set PAID. |
| C2 ✔ | EFMUM (and MEMUM) | **The export-of-service branch is unreachable.** The rule is looked up `WHERE country_code = buyerCountry`, then the export test requires `taxRule.countryCode==='IN' && customer!=='IN'`, which can't both be true. Foreign sales fall to `NO_TAX` ("No Tax Applicable", title "INVOICE", no LUT note), or to Indian GST if a rule exists for that country. `country_code CHAR(3)` padding may also break `=== 'IN'` [verify]. | `tax-master.service.ts:14-29`, `tax-engine.service.ts:20-48`, `108_product.sql:103` | IGST Act s.2(6), Rule 96A, Rule 46: an export invoice needs the LUT endorsement and must be reported as export (GSTR-1 6A). Exports are mis-reported, and zero-rating may be denied. | **P0.** Choose export vs domestic by the supplier's country vs the customer's country, using the franchise's own IN rule. Read `franchise.internationalTaxMode` and the LUT. Add an `EXPORT_OF_GOODS` mode. Handle INR-paid foreign clients explicitly (see H10). |
| C3 ✔ | MEMUM | **Product tax swaps supplier and customer.** The caller passes `(franchiseAddress, billingAddress)` into `calculateTax(..., billingAddress, franchiseAddress)`. The buyer is treated as the supplier, so the rule is always looked up with buyer = India. Foreign buyers get GST, as IGST, and `jurisdiction.placeOfSupply` is stored as the franchise's country. | `member-product.service.ts:383-393` vs `:947-953` | Export of goods under LUT should be zero-rated, so overcharging GST is a customer-facing error. Stored place of supply is wrong for every product order. | **P0.** Fix the argument order, add a regression test, and re-classify affected foreign orders (credit note plus re-issue). **[CA]** |
| C4 | All | **Issued invoices are mutable and have no audit trail.** `update()` overwrites amounts, tax, tax mode, GSTIN, billing address, payment date and status on invoiced payments. `invoiceNote` is not refreshed (an "export under LUT" note can survive a change to domestic). There is no history table. PDFs are re-rendered from live data, including product HSN and franchise master. | `member-plan.service.ts:533-561, 557, 1052`, `member-product.service.ts:479` | CGST s.35, s.36 and Rule 56(8): no erasure, and electronic records need an edit log, kept 72 months. Companies (Accounts) Rules 3(1) audit trail, if the entity is a company. UAE: records kept 5 years (VAT) and 7 years (corporate tax). | Freeze a snapshot of the invoice document at issue (store the rendered JSON, and optionally the PDF hash). Add an append-only change log (who, when, before, after). Allow only non-financial edits after issue; corrections go through credit or debit notes. |
| C5 | All | **No credit notes, debit notes, receipt vouchers or refund vouchers.** The refund webhook only writes `refundObj` and does not change status, reverse tax or appear in reports. RTO and cancellation of goods trigger nothing. | `razorpay-webhook.controller.ts:1117-1182`, `shipment-orchestration.service.ts:263-270`; no matches for credit_note anywhere | CGST s.34 and Rule 53 (credit note referencing the original, reported by 30 Nov of the next FY). Rules 50 and 51 (receipt and refund vouchers; GST on advances for services). UAE ER Art 60 "Tax Credit Note", issued within 14 days. | New feature: credit and debit notes in their own series per entity, linked to the original invoice, with a PDF, and refunds and RTO wired to them. Receipt and refund vouchers where advances arise. |
| C6 | All | **Invoice numbers are 22–26 characters.** | `invoice-sequence.service.ts:44` | Rule 46(b): at most 16 characters. The GSTR-1 upload rejects longer numbers. Accounts re-keys numbers in Tally, so the customer's PDF number differs from the filed number. | Owner accepted the risk (spec 4.1, decision 3). Recommend a compliant format from FY 2027-28. **[CA]** |

### High

| ID | Entity | Finding | Evidence | Recommendation |
|---|---|---|---|---|
| H1 | EFMUM, MEMUM | **Invoice PDF is missing required particulars:** place of supply (state name and code; the template reads a misspelt `playOfSupply` through `formatDate`), LUT ARN plus the exact export endorsement text, the INR value and exchange rate for foreign-currency invoices, the reverse-charge Yes/No line, amount in words (computed but not printed), unit of quantity per line, per-line taxable value and CGST/SGST/IGST split, and the buyer's legal or company name. The buyer GSTIN is printed twice. | `invoice.hbs:363-367, 413-470`, `invoice.mapper.ts:96, 313-317`, `invoice-pdf.service.ts:57` | Bring the template up to the Rule 46 checklist (§5.1). Add a field-by-field check in tests. |
| H2 | MEMUM, EFMUM, HCUAE | **The seller entity is picked alphabetically.** Products use `getProductFranchise()[0]`. Checkout gateways use `franchiseByBusinessType(SERVICE)[0]`, sorted by company name, so "EAT FIT 247" sorts before "Healuxe" and "Mahi". | `member-product.service.ts:226-231, 1121-1203`, `member-plan.service.ts:1265, 1318, 1476`, `franchise.service.ts:292` | Product sales could be invoiced under EatFit247's GSTIN. An HCUAE client's money could land in EatFit247's gateway while HCUAE issues the invoice. Make the seller explicit (product → selling franchise; checkout → member's franchise) and enforce a single product-seller flag. |
| H3 | EFMUM ↔ HCUAE | **No inter-company (B2B) invoicing.** There is no customer-as-company entity and no settlement or per-client fee logic (done in Excel). Nutritionist ↔ franchise mapping is deleted and recreated on save, so history is lost. | roadmap 7.1, `admin-user.service.ts:70`, `member.service.ts:269-311` | Build 7.1: a B2B customer master (legal name, address, TRN or tax ID, country), a monthly per-client statement from `txn_member_payments.franchise_id = HCUAE` plus the serving nutritionist, and an EFMUM export invoice (LUT, foreign currency, contract reference, service period). Keep mapping history with effective dates. |
| H4 | All | **Reports are not filing-ready.** No status filter (PENDING and FAILED are mixed in). No discount, taxable value, buyer GSTIN, place-of-supply state, SAC/HSN, INR value, or B2B / B2CL / B2CS / EXP split. No HSN summary (Table 12, B2B and B2C split since 2025). No documents-issued summary (Table 13, mandatory since May 2025). Franchise filter uses the member's current franchise instead of `payment.franchise_id`. Product export has no tax split or currency column. | `payment-report.service.ts:203-221, 279-315`, `member-product-report.service.ts:188, 296, 336, 560-590` | A "GSTR-1 workbook" export per GSTIN and month, and a UAE VAT-201 summary for HCUAE (§5.3). |
| H5 | EFMUM, MEMUM | **Rates and classification need a CA decision.** **[CA]** Diet consultation may be SAC 99972 "physical well-being", which has been 5% with no input credit since 22 Sep 2025, rather than 999319 at 18%. The health-care exemption is unlikely (no clinical establishment). The debloat powder is HSN 3004 (AYUSH) or 2106 (supplement), and both are **5% since 22 Sep 2025 (GST 2.0)** [verify]. The system uses a single global SAC `999319`, `referenceId=1` hard-coded for every plan, and the rule lookup uses *today's* date and ignores `active` and `transactionType`. | `member-plan.service.ts:203, 865, 1554`, `tax-master.service.ts:14-29`, `107_*.sql:613` | Effective-dated SAC/HSN → rate master. Look up the rule by the payment or supply date. Respect `active`. Snapshot the HSN/SAC onto each payment and line. Check whether Sep 2025 – now invoices used the right rate. |
| H6 | HCUAE | **UAE VAT non-compliance.** Foreign clients are recorded as `NO_TAX` / "INVOICE" when they should be **zero-rated, 0%**, with a (simplified) "Tax Invoice" (ER Art 31, Art 59). VAT invoices are not titled "Tax Invoice" and say "VAT No." instead of TRN. There are no AED equivalents for USD invoices (Decree-Law Art 69). AED amount in words prints "Rupees/Paise". There is no evidence capture for zero-rating (residence, <30 days in the UAE). UAE residents temporarily abroad must be charged 5%. | `invoice.mapper.ts:85, 265-267, 434`, `invoice-pdf.service.ts:296-306` | UAE VAT feature: S/Z/E/O category per line, "Tax Invoice" with TRN, AED totals at the Central Bank rate, zero-rating evidence fields, Tax Credit Notes (CD 149/2026 [verify]), VAT-201 extract (Box 1 by **Dubai** establishment, Box 3/10 reverse charge, Box 4 zero-rated). Confirm HCUAE has a TRN. |
| H7 | EFMUM, HCUAE | **Webhook integrity.** A late `payment.failed` can overwrite a PAID, invoiced record (only PAID→PAID is skipped). `payment.captured` and `order.paid` share a handler with no row lock, so two parallel events can each issue a number, burning one (plausible, not reproduced). Amounts are divided by 100 for every currency. | `razorpay-webhook.controller.ts:258, 304, 529, 758-772` | Status transitions only move forward. `SELECT … FOR UPDATE` on the payment before issuing. Currency-aware minor units. Store every webhook event. |
| H8 | MEMUM | **Export of goods is undocumented.** No IEC, Courier Shipping Bill (CSB-V) number, port code or shipping-bill date (GSTR-1 6A), no e-way bill (≥ ₹50k), no LUT validity. Couriers receive amounts in the order currency while adapters assume INR. Shiprocket gets the warehouse as the billing address. The ₹10 lakh courier cap was removed from 1 Apr 2026 [verify]. | `shipment-orchestration.service.ts:158, 614`, `nimbus.adapter.ts:133`, `shipway.adapter.ts:106`, `shiprocket.adapter.ts:179-186` | Export fields on the order and shipment, an LUT register, an export-realisation ageing report (3 months to export under LUT; FEMA realisation 9 months, 12 if INR-invoiced, from 1 Oct 2026 [verify]). |
| H9 | All | **Currency and FX.** No exchange rate is stored per transaction. The `mst_currency_configs` seed has USD→INR = 1 and is unused. INR values for GSTR-1, AED values for UAE VAT and FEMA realisation cannot be derived. | `2_master_tables.sql:442-447`, `101_*.sql:1019-1020` | Store the currency, rate, rate source/date, and INR (or AED) equivalents on every invoice and line at issue. |
| H10 | EFMUM | **Foreign clients paying in INR.** Export status requires payment in convertible foreign exchange, or INR only where the RBI permits it (Vostro, or PA-CB with e-FIRA **[CA]**). INR via UPI or netbanking from Indian accounts does **not** qualify, so 18% **IGST** applies. The engine's INR guard (unreachable today) throws a raw 500 error. | `tax-engine.service.ts:49-51` | Capture the payment rail and FIRC/e-FIRA reference per payment. Classify foreign + INR (domestic rail) as IGST 18%. Monthly **Export Declaration Form (EDF)** extract for services, new under FEMA 2026 [verify]. |

### Medium

| ID | Finding | Evidence | Recommendation |
|---|---|---|---|
| M1 | **Timezone and FY.** No timezone is configured. Webhook `payment_date` comes from a UTC timestamp, so payments made 00:00–05:30 IST can carry the previous day (31 Mar vs 1 Apr). The FY of the invoice number comes from `new Date()`, not the payment date, so backdated entries get the current FY. | `razorpay-webhook.controller.ts:290, 415`, `invoice-sequence.service.ts:30`, `invoice-pdf.service.ts:243-249` | Set `TZ=Asia/Kolkata` (or the franchise's timezone) for date derivation. Derive the FY from the invoice date. Block or flag backdating across FY boundaries. |
| M2 | **Missing address data changes the tax.** A missing state silently gives IGST. A missing billing address gives customer country `''`, so NO_TAX on domestic clients. A missing franchise address causes a TypeError crash. | `india-gst.service.ts:12-32`, `member-plan.service.ts:327-340, 855, 866` | Require a billing address with country and state before any tax calculation. Under Rule 46(e), name, address and state are mandatory for B2C invoices ≥ ₹50,000 anyway. |
| M3 | **Rounding.** CGST is taken as tax/2, unrounded. PDF lines are rounded separately (off by 0.01). Services have no `rounding_adjustment`. The tax-inclusive formula subtracts a tax-inclusive discount from a tax-exclusive base. | `india-gst.service.ts:8-23`, `tax-engine.service.ts:32-35` | One rounding policy: per line, to 2 decimals, CGST = SGST rounded, with a residual in the rounding adjustment. |
| M4 | **Customer GSTIN and supplier IDs are not validated.** No GSTIN checksum. GSTIN does not trigger B2B treatment. No TRN field (only `vatNumber`). LUT has no date or validity. The supplier GSTIN is omitted on NO_TAX invoices. | `member-plan.dto.ts:66-69`, `franchise.dto.ts:70-72`, `invoice.mapper.ts:262-268` | Validate GSTIN and TRN formats. Add an LUT register (ARN, FY, valid from/to) with a block when it expires. Always print the supplier tax ID. |
| M5 | **Promo codes are never checked.** Discount is a free amount. | `member-plan.service.ts:377, 541`, `member-product.dto.ts:66-69` | Validate against `txn_promo_codes` on the server. Store the promo reference on the payment. |
| M6 | **"Verification" QR is home-made JSON.** It is neither an IRN QR nor a UPI QR, but is labelled "Scan for Invoice Verification". | `invoice.mapper.ts:209-249, 399-417` | Relabel it or remove it. Use a real IRN QR when e-invoicing applies (AATO > ₹5 crore per PAN; exports and B2B only). |
| M7 | **No inventory.** There is no stock ledger, and RTO has no stock reversal. | — | Basic stock ledger for MEMUM (receipts, sales, RTO, write-offs) to support books and closing stock. |
| M8 | **History loss in masters.** Product price rows are hard-deleted on edit. `txn_shipments` cascade-delete from `txn_member_products` at DB level. | `product.service.ts:497`, `108_product.sql:252` | Soft-delete or version prices. Change the FK to RESTRICT. |
| M9 | **HCUAE corporate tax position.** Diet consulting to individuals is not a Qualifying Activity, and transactions with natural persons are an Excluded Activity (MD 229/2025). Plan on 9% above AED 375k, or Small Business Relief (≤ AED 3m, extended to periods ending 31 Dec 2029 [verify]). Records must be kept 7 years. | — | **[CA-UAE]** Confirm the position. Ensure the system can produce revenue by period in AED. |

### Low

| ID | Finding | Recommendation |
|---|---|---|
| L1 | A plaintext SMTP password is committed in `db_changes/107_*.sql` (`SYSTEM_EMAIL_PASSWORD`). This is a security finding, not an accounting one. | Rotate the password and move it to env/secret storage. |
| L2 | Product invoices say "non-refundable … under any circumstances" for goods. | Align with Consumer Protection (E-Commerce) Rules and the returns policy. **[legal]** |
| L3 | The ₹/AED amount-in-words map defaults to "Rupees/Paise". | Add a currency-aware wording map. |

### Positives

- Tax is computed once and stored per payment and line, with an address snapshot.
- Invoice numbers come from a row-locked counter, and `invoice_id` has a unique index.
- Numbers are never changed after issue.
- There is no delete path for payments or orders in code, and audit columns are everywhere.
- The webhook checks the signature (timing-safe), the amount (±0.01) and the currency, and PAID→PAID is idempotent.
- The payment report keeps currencies separate.

## 4. Entity view

- **EFMUM (EatFit247, services):**
  - Critical: C1, C2, C4, C5, C6.
  - Decide the SAC and rate (H5) and the INR-from-abroad treatment (H10).
  - The Dubai B2B fee needs H3.
  - **[verify]** Finance Act 2026 reportedly omitted IGST s.13(8)(b) from 30 Mar 2026, so the "intermediary" risk on the Dubai fee falls away for later periods. Even before that, a per-client coaching fee for services EatFit247 performs itself is a principal-to-principal supply. The contract should say so, with no "arranging" or commission language.
  - Monthly EDF reporting to the bank for service exports (FEMA 2026) [verify].
- **MEMUM (Mahi, goods):**
  - Critical: C3 (wrong GST on exports), C4, C5.
  - Export documentation (H8), seller selection (H2), the HSN/rate decision at 5% after GST 2.0 (H5), inventory (M7).
  - If Mahi and EatFit247 share a **PAN** (for example, one proprietor), their aggregate turnover combines for e-invoicing, HSN digits and thresholds. **[CA]**
- **HCUAE (Dubai):**
  - H6 (zero-rating, "Tax Invoice", TRN, AED).
  - Reverse charge on EatFit247's fee: Box 3/10; self-invoicing abolished from 1 Jan 2026 [verify].
  - M9 (corporate tax).
  - UAE e-invoicing: **B2C is excluded for now**. It applies only if HCUAE makes B2B sales. Otherwise appoint an ASP by 31 Mar 2027 and go live 1 Jul 2027 for revenue < AED 50m.
  - Plan on 7-year record retention.

## 5. What the system must store, print and report (condensed checklist)

### 5.1 Indian tax invoice and export invoice (Rule 46)
- **Supplier:** name, address, GSTIN.
- **Number:** at most 16 characters, consecutive, unique per FY; multiple series allowed.
- **Date.**
- **Recipient:** name and address. For B2C invoices ≥ ₹50k, also the delivery address and the state name and code. Recipient GSTIN for B2B.
- **HSN/SAC:** 4 digits up to ₹5 crore AATO; 6 digits above.
- **Lines:** description, quantity and unit, value, discount, taxable value, rate, and CGST/SGST/IGST amounts.
- **Place of supply,** reverse-charge flag, and signature or DSC (not needed for electronic invoices).
- **Export invoices also need:**
  - the endorsement "SUPPLY MEANT FOR EXPORT … UNDER BOND OR LETTER OF UNDERTAKING WITHOUT PAYMENT OF INTEGRATED TAX"
  - LUT ARN and FY, and country of destination
  - currency and INR value
  - for goods: shipping bill number and date, and port code
- **Vouchers:** receipt voucher (Rule 50) for advances on services; refund voucher (Rule 51).
- **Credit notes:** reference the original; reported by 30 Nov of the next FY. From 1 Oct 2025, s.34(2) lets the supplier reduce output tax on B2C only if the tax was not passed on, so refund the GST portion [verify].

### 5.2 Indian filing data
- **GSTR-1:**
  - B2B, B2CL (inter-state ≥ ₹1 lakh [verify]), B2CS, EXP (6A), CDNR/CDNUR (9B), advances (11A/11B)
  - HSN summary (Table 12, B2B/B2C split)
  - documents issued (Table 13: first and last number, cancelled numbers per series)
- From July 2025: the auto-populated GSTR-3B liability is hard-locked, and returns can't be filed more than 3 years late, so GSTR-1 must be right first time [verify].
- Retain records for 72 months (GST) and 8 years (Companies Act, if a company).

### 5.3 UAE (HCUAE)
- **Invoice types:**
  - Full "Tax Invoice": TRN for both parties, sequential number, supply date, line rate and VAT, VAT in AED.
  - Simplified tax invoice: for unregistered recipients or ≤ AED 10k.
  - Tax Credit Note: within 14 days.
- **Per line:** VAT category S / Z / E / O.
- **Zero-rating evidence:** residence country, outside the UAE, under 30 days of UAE presence.
- **Monthly or quarterly VAT-201:**
  - Box 1 standard-rated by **the emirate of HCUAE's establishment (Dubai)**
  - Box 3 and Box 10 reverse charge on EatFit247's fee
  - Box 4 zero-rated
- **Corporate tax:** retain records 7 years.

## 6. Impact on feature 4.1 (`specs/features/2026-10-10-invoice-number-non-gst`)

The spec's **decision 1** chooses the EXP series when the stored `tax_mode = EXPORT_OF_SERVICE`. C2 and C3 show that this mode is (almost certainly) **never stored**:
- EFMUM foreign clients are stored as `NO_TAX`.
- MEMUM foreign orders are stored as `DOMESTIC_GST`.

The Q2 migration would therefore move nobody into the EXP series. Two options:

| Option | What changes | Trade-off |
|---|---|---|
| **A (recommended)** | Fix C2 (and C3 for products) in a small **tax-engine export fix** feature that ships **before or with** 4.1. Keep decision 1 for new invoices. For the Q2 renumbering, classify historical rows by the **billing-country snapshot** (`member_address` ≠ India) for Indian franchises, not by the stored mode. | Correct tax going forward. The migration rule differs from the runtime rule and must be documented. Historical tax fields stay as issued, with corrections via credit notes or a CA decision. |
| B | Leave tax alone. Choose the series by billing country ≠ India (Indian franchises only), both at runtime and in the migration. | Faster, but the series disagrees with the invoice's tax treatment ("No Tax" printed on an EXP invoice) and leaves C2 open. |

First, run this on production to confirm:

```sql
SELECT franchise_id, tax_mode, count(*) FROM txn_member_payments GROUP BY 1, 2;
SELECT tax_mode, count(*) FROM txn_member_product_order_items GROUP BY 1;
```

## 7. Recommended roadmap

> **Scheduled (replan 2026-10-10):** [roadmap.md](../product/roadmap.md) items 4.5 lockdown, 4.6 tax engine, 4.7 invoice series and proforma, 4.8 immutability, 4.9 credit notes and vouchers, 4.10 particulars and FX, 4.11 rate master, 4.12 seller entity, 4.13 filing reports, 7.1 settlement and B2B invoice, 7.4 goods export documents, 8.0 UAE VAT, plus finance follow-ups under "Later".

| Priority | Item | Covers |
|---|---|---|
| **P0 (this week)** | Lock down public checkout (server-set status, source, date and discount; promo validation) | C1, M5 |
| **P0** | Tax-engine export fix plus product address-swap fix, LUT register and endorsement, INR-from-abroad rule | C2, C3, H10, M4 |
| **P0** | Webhook forward-only status plus row lock | H7 |
| P1 | 4.1 separate export series (revised per §6) | spec 4.1 |
| P1 | Immutable invoice snapshot plus change log; restrict post-issue edits | C4 |
| P1 | Credit and debit notes, receipt and refund vouchers; refund and RTO wiring | C5 |
| P1 | Invoice particulars (place of supply, LUT, INR/AED value, reverse charge, amount in words, per-line tax) | H1, L3 |
| P1 | CA decision on SAC/HSN and rates; effective-dated rate master; check Sep-2025-onward rates | H5 |
| P2 | GSTR-1 workbook (B2B/B2CL/B2CS/EXP, HSN summary, documents issued) and VAT-201 extract | H4 |
| P2 | Explicit seller entity for products and checkout gateway | H2 |
| P2 | FX per transaction (rate, INR and AED equivalents) | H9 |
| P2 | Partner settlement and B2B invoice EFMUM → HCUAE (roadmap 7.1), B2B customer master, mapping history | H3 |
| P2 | Export of goods documentation, export-realisation ageing, EDF extract | H8, H10 |
| P3 | UAE VAT compliance for HCUAE (zero-rated category, Tax Invoice/TRN, AED, Tax Credit Notes) | H6 |
| P3 | Timezone and FY derivation, rounding policy, address requirements | M1–M3 |
| P3 | Inventory ledger; master-data versioning | M7, M8 |
| P3 | Rule 46 compliant numbering from FY 2027-28; e-invoicing readiness (India IRN if AATO > ₹5 crore; UAE ASP by 31 Mar 2027 if B2B) | C6, M6 |

## 8. Questions for the CA / UAE tax adviser

1. **SAC and rate for diet consultation:** 999319 at 18%, or 99972 at 5% with no input credit since 22 Sep 2025? Is any health-care exemption available?
2. **Debloat powder:** HSN 3004 (AYUSH) or 2106 (supplement)? Confirm the post-GST-2.0 rate and the drug or food export rules.
3. **Foreign clients paying in INR:** Razorpay cross-border (PA-CB) settlements, NRE and UPI. Which count as export proceeds?
4. **EFMUM–HCUAE fee:** contract wording (principal-to-principal), currency, invoice timing. Was any period before 30 Mar 2026 affected by the intermediary rule?
5. **Entity constitution:** are EFMUM and MEMUM companies (audit-trail rule) and do they share a PAN (aggregation)?
6. **HCUAE:** TRN status, the zero-rating evidence policy, the corporate-tax position (QFZP unlikely), and whether the parties are related.
7. **Corrections:** how to correct foreign invoices already issued as "No Tax" (EFMUM) or with GST charged (MEMUM). Credit notes, GSTR-1 amendments (Table 9A), or leave as is?

## Sources

**India (GST, FEMA, income tax)**
- Rule 46, CGST Rules (CBIC): https://taxinformation.cbic.gov.in/content/html/tax_repository/gst/rules/cgst_rules/active/chapter6/rule46_v1.00.html
- s.13 CGST Act, time of supply of services (CBIC): https://taxinformation.cbic.gov.in/content/html/tax_repository/gst/acts/2017_CGST_act/active/chapter4/section13_v1.00.html
- Circular 202/14/2023-GST (INR via Vostro): https://gstcouncil.gov.in/sites/default/files/2024-06/circular-no-202-14-2023.pdf
- GSTR-1 16-character error: https://community.getswipe.in/t/error-serial-number-is-more-than-16-characters-while-trying-to-download-the-gstr-1-json-report/845
- Documents issued / cancelled invoices: https://www.gstcouncil.gov.in/sites/default/files/e-version-gst-flyers/51_GST_Flyer_Chapter33.pdf
- Credit notes: https://tallysolutions.com/gst/credit-note-under-gst/
- Wrong tax type correction: https://busy.in/gst/wrong-gst-type-charged-a-gst-invoice-mistake-correction-checklist/
- Rule 96A: https://gstgyaan.com/rule-96a-of-the-cgst-rules-refund-of-integrated-tax-paid-on-export-of-goods-or-services-under-bond-or-letter-of-undertaking
- Intermediary, s.13(8)(b) omission [verify]: https://www.grantthornton.in/insights/articles/gst-on-intermediary-services/ and https://taxguru.in/goods-and-service-tax/intermediary-conundrum-omission-section-13-8-b-igst-act-finance-act-2026.html
- Courier export cap removal [verify]: https://taxguru.in/custom-duty/rs-10-lakh-cap-removed-courier-exports-boost-e-commerce-trade-1st-april-2026.html
- Courier regulations: https://courier.cbic.gov.in/regulation/2022/Updated%20ECCS%20Regulation%20with%20forms.pdf
- E-way bill / e-invoice advisory: https://www.mahagst.gov.in/public/uploads/gstnadvisory/1760530021_309.Advisory%20on%20Updates%20to%20E-Way%20Bill%20and%20E-Invoice%20Systems.pdf
- FEMA realisation 2026 [verify]: https://www.corplawupdates.in/updates/fema-export-realisation-period-9-months-first-amendment-2026 and https://taxguru.in/rbi/foreign-exchange-management-export-import-goods-services-amendment-regulations-2026.html
- EDF for services [verify]: https://www.startupadvisory.in/blog-export-of-services-reporting-rbi-edf-fema-2026.htm
- RBI Payment Aggregator directions: https://rbi.org.in/Scripts/BS_ViewMasDirections.aspx?id=12896
- E-invoicing 2026: https://tallysolutions.com/business-guides/what-changed-in-e-invoicing-compliance-in-2026/
- Medicines rate (GST 2.0): https://busy.in/gst-rates/medicines/
- Nutraceuticals at 5%: https://www.nutraingredients.com/Article/2025/09/10/india-cuts-gst-for-nutraceuticals-to-5/
- Heading 9997 rates: https://gstgyaan.com/cgst-rate-on-other-services-heading-9997
- Nutrition consultancy advance ruling: https://www.jurishour.in/gst/food-supply-under-prescribed-diet-package-is-a-composite-supply-different-from-normal-restaurant-services-18-gst-applicable/
- Finance Act 2025 amendments (s.34): https://taxguru.in/goods-and-service-tax/gst-amendments-finance-act-2025-effective-oct-1-2025-notified.html
- HSN dropdown, Table 13: https://www.taxmann.com/post/blog/hsn-dropdown-table-13-mandatory-in-gstr-1
- 3-year bar on returns: https://www.teamleaseregtech.com/updates/article/43326/gstn-advisory-on-bar-on-filing-gst-returns-after-3-years-from-due-date/
- ICAI audit-trail guide: https://www.eirc-icai.org/uploads/background_materials/Revised%202024_Implementation%20Guide%20on%20Reporting%20of%20Audit%20Trail%20(1)_1712114860.pdf
- TCS 206C(1H) omitted: https://taxguru.in/income-tax/budget-2025-tcs-sale-goods-omitted-april-2025.html
- Equalisation levy: https://www.incometaxindia.gov.in/equalisation-levy3
- DTAA Article 7, FTS: https://bcajonline.org/journal/article-7-in-absence-of-a-specific-article-on-fee-for-technical-service-fts-income-from-services-rendered-in-the-normal-course-of-business-is-to-be-classified-as-bu/

**UAE (VAT, corporate tax, e-invoicing)**
- Zero-rating, ER Art 31: https://www.deloitte.com/middle-east/en/services/tax/perspectives/new-public-clarification-on-the-amendments-to-the-executive-regulations.html and https://www.fticonsulting.com/uk/insights/articles/fti-consulting-uae-vat-update
- Tax invoice requirements: https://www.meydanfz.ae/blog/uae-tax-invoice-requirements and https://mondaq.com/sales-taxes-vat-gst/670546/tax-invoice-under-uae-vat-law
- CD 149/2026 [verify]: https://kpmg.com/ae/en/insights/tax-insights/Cabinet-Decision-149-of-2026-aending-certain-provisions-of-the-vat-executive-regulation.html
- CD 100/2025: https://www.crowe.com/ae/news/what-is-the-recent-amendment-to-uae-vat
- VAT law amendments from 1 Jan 2026: https://www.dlapiper.com/en/insights/publications/gulf-tax-insights/2025/gulf-tax-insights-december-2025/uae-announces-amendments-to-vat-law-effective-1-january-2026 and https://mof.gov.ae/en/news/ministry-of-finance-to-implement-vat-law-amendments-starting-january-2026/
- Healthcare VAT: https://www.pwc.com/m1/en/tax/vat-in-the-middle-east/pdf/implementation-flyers/how-vat-impacts-you-healthcare.pdf
- Electronic services: https://farahatco.com/blog/vat-treatment-supply-electronic-services-uae
- VAT return boxes: https://www.businessdubai.ae/blogs/uae-vat-return-filing
- E-invoicing: https://mof.gov.ae/wp-content/uploads/2025/09/Ministerial-Decision-No.-244-of-2025-on-the-Implementation-of-the-Electronic-Invoicing-System.pdf, https://kpmg.com/ae/en/insights/tax-insights/implementation-of-the-electronic-invoicing-system-in-the-uae.html, https://vatit.com/e-invoicing-guide/united-arab-emirates/, https://www.bdo.ae/en-gb/news/news/uae-e-invoice-update-cabinet-decision-no-106-of-2025
- Qualifying activities (corporate tax): https://mof.gov.ae/wp-content/uploads/2025/09/EN-Ministerial-Decision-No.-229-of-2025-Regarding-Qualifying-Activities-and-Excluded-Activities.pdf
- Small Business Relief extension [verify]: https://www.ifcreview.com/news/2026/august/uae-extends-corporate-tax-relief-for-small-businesses-until-end-of-2029/
- Corporate-tax record retention: https://www.financemiddleeast.com/tax/fta-orders-seven%e2%80%91year-corporate-tax-record-retention-sets-9%e2%80%91month-filing-deadline/
- Economic substance withdrawn: https://bdo.global/en-gb/insights/tax/world-wide-tax/united-arab-emirates-economic-substance-regulations-withdrawn
- India–UAE DTAA: https://www.nishithdesai.com/NewsDetails/9564
