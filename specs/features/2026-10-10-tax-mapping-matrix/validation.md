# Validation: Tax Mapping Matrix

> How we know the feature is done and correct. The agent runs every automated check. A human runs the manual checks and signs off on the review.

## Acceptance Scorecard

Row numbers refer to the mapping table in `requirements.md`.

| # | Criterion (Given / When / Then) | How verified | Result |
|---|---------------------------------|--------------|--------|
| A1 | Fresh DB after 137–144 → `mst_tax_master` holds EFMUM IN SERVICE GST 18 (999319), HCUAE AE SERVICE VAT 0 Z, and per active product one active `NONE` + one inactive `GST_5` row for MEMUM, each with `legal_basis` | SQL | ✅ 2026-10-11 — rolled-back fresh run on an emptied table: EFMUM GST_18 999319, HCUAE VAT_0 Z, MEMUM NONE_0 (active) + GST_5 (inactive, HSN 3004), each with legal_basis |
| A2 | 144 applied twice, and once on a DB with hand-entered EFMUM/HCUAE rules → no error, no duplicate rules | SQL | ✅ applied 3× locally (NOTICEs only); on the pre-populated local DB only the staged GST_5 row was added, no duplicates |
| A3 | Row 1: EFMUM, Maharashtra billing → CGST 9 + SGST 9, `place_of_supply_state_code = '27'` stored | test + curl | ✅ matrix spec row 1 + live engine (ts-node): CGST 90.45 + SGST 90.45 on 1005, PoS IN/27, SAC 999319 |
| A4 | Row 2: EFMUM, Karnataka billing → IGST 18, state code stored | test + curl | ✅ matrix spec row 2 + live: IGST 180.9, PoS IN/29 |
| A5 | Rows 3/4 with the staged `GST_5` row active: same-State delivery → CGST 2.5 + SGST 2.5; other State → IGST 5; HSN from the rule on the line | test | ✅ matrix spec rows 3/4 (staged rule active): CGST 25.13 + SGST 25.12 / IGST 50.25, HSN 3004 on the line |
| A6 | Rows 3/4 with MEMUM `NONE` active: same-State delivery → no tax, plain invoice; other-State delivery → 400 s.24(i) unless `ALLOW_UNREGISTERED_INTERSTATE_GOODS` | test + curl | ✅ matrix spec: NONE same-State → no tax; other-State → 400 "CGST s.24(i)"; override config → NO_TAX. Live DB still carries the hand-entered GST 12% rule, so the live path showed 12% (expected until the CA switch) |
| A7 | Row 5: US + USD + valid LUT → 0%, EXPORT series, place of supply country `US`, state null | test | ✅ matrix spec row 5 + live: 0% under AD270326000001T, EXPORT series, PoS US / state null |
| A8 | Row 5b: US + USD, LUT expired → IGST 18, EXPORT series, "on payment of IGST" | test | ✅ matrix spec row 5b + live (supply 2025-06-01T19:30Z → IST 2025-06-02, no LUT): IGST 18, EXPORT series, "ON PAYMENT OF INTEGRATED TAX" |
| A9 | Row 6: US + INR DOMESTIC → IGST 18, DOMESTIC series, reason stored | test | ✅ matrix spec row 6 + live: IGST 18, DOMESTIC series, reason "not an export" |
| A10 | Row 7: goods delivered to AE, LUT valid → EXPORT_OF_GOODS 0%; without LUT → IGST at rule rate | test | ✅ matrix spec row 7 (LUT → 0%; none → IGST 5 paid) + live MEMUM→AE: EXPORT_OF_GOODS with IGST (no MEMUM LUT) |
| A11 | Row 8: HCUAE, AE client → VAT 0 Z today; flipping the rule to 5 STANDARD gives VAT 5 S without a deploy | test + admin | ✅ matrix spec row 8 (0 Z; 5 S by config) + live: VAT 0 Z, PoS AE/1; rule flip to 5% STANDARD gives VAT 5 S without a deploy |
| A12 | Row 10: HCUAE, US client → VAT 0 Z with the services note; row 11/13 goods → goods note and "delivery address" reason | test | ✅ matrix spec rows 10 (US, SA) and 11/13 (goods: Art 30 note, "delivery address" reason) + live row 10 |
| A13 | Row 12: HCUAE, India billing → 400 "Indian clients must be registered under the India franchise" | test + curl | ✅ matrix spec + live: 400 "Indian clients must be registered under the India franchise."; no rule lookup |
| A14 | Row 14: plan with `is_electronic_service = true` sold by EFMUM to AE → same result as row 5/6 (flag stored, no engine change) | test | ✅ matrix spec row 14: flag has no engine effect; admin API round-trip of isElectronicService true → false on plan 266 |
| A15 | Per-plan reference: a SERVICE rule for `reference_id = <planId>` wins; with none, the `reference_id = 1` row applies | test | ✅ matrix spec A15 + live: reference 999 fell back to reference 1 (18%) |
| A16 | Supply date for HCUAE evaluated in `Asia/Dubai` (LUT / rule validity at 23:30 Dubai time does not use the next IST day) | test | ✅ matrix spec A16: 19:30Z → Dubai 2026-10-11 vs IST 2026-10-12 |
| A17 | Rounding: for an odd tax amount CGST + SGST equals the total tax exactly; totals equal the sum of printed lines | test | ✅ matrix spec: 1000.05 × 18% → 180.01 = CGST 90.01 + SGST 90.00; IGST 333.33 → 60.00; totals equal line sums |
| A18 | Invoice PDF prints place of supply from the stored codes; editing the member's address afterwards and re-downloading leaves it unchanged | browser | ✅ 2026-10-11 browser — web payment 5143 (`EFMUM/2026-27/S/000013`, Maharashtra): billing address row switched to Karnataka/Bengaluru, PDF re-downloaded from admin still prints `Place of Supply: Maharashtra (27)` and the original Bill To snapshot; address reverted |
| A19 | Functional currency for a franchise comes from `mst_countries.currency_code` (no `'AE'` literal) | test | ✅ `InvoiceIssueService.franchiseContext` reads `mst_countries.currency_code` (IN→INR, AE→AED, US→USD seeded); FX specs updated and green |
| A20 | Admin tax-master list shows HSN/SAC and legal basis; program-plan form has the electronic-service toggle; deprecated fields hidden | browser | ✅ 2026-10-11 browser — `/tax-master` lists HSN/SAC 999319 / 3004 and the legal-basis text (staged GST_5 row inactive); `/program-plans/edit/263` shows the "Electronic service" checkbox and the fee rows (USD 250 added there for the checkout test); payment preview shows place of supply + decision reason. Gaps: the list has no Franchise column; the plan form accepts a fee of 0 |
| A21 | Website shows one consistent tax statement on product, checkout, seasonal plans and FAQ; State field carries the place-of-supply hint | browser (Safari + mobile width) | ✅ Chrome desktop 2026-10-11 — checkout sidebar/total line agree with the server decision for every case (`GST 18%` / `IGST 18%` / `Export – 0% (LUT)` / `VAT 0% (zero-rated)` / `IGST 12% (export)` on the product); State field shows the place-of-supply hint. ⏳ Safari + mobile width not run |
| A22 | Matrix spec covers every row 1–14 and variant; member jest green | jest | ✅ `tax-engine.matrix.spec.ts` 26 cases; member jest 265 + 26 green |

## Automated Checks

- [x] `cd shared-library && npm run build`
- [x] `cd server_1 && npx nx affected --target=lint,test,build` — member jest 291/291 (19 suites + matrix); admin-api and public-api build. `platform` jest fails to load on the base commit too (enum import cycle), unrelated
- [x] `cd eatfit247-admin && npx nx affected --target=lint,test,build` — development build green; production build fails only on the pre-existing dashboard SCSS budgets
- [x] `cd eatfit247-web-1 && npx nx build` (SSR build) — green
- [x] Migration 144 applies cleanly: 3× on the local DB, and the seed block on an emptied rule table in a rolled-back transaction. ⏳ a copy of production data (owner, pre-release)

## Manual Checks

- [x] API: rows 1, 2, 5, 5b, 6, 6b, 3, 4, 7, 8, 10, 11, 12 exercised through `TaxEngineService.calculate` in a booted Nest context against the local DB (2026-10-11); admin `tax-master` and `program-plan` round-trips on the worktree API (:3101). ⏳ the member `calculate-tax` HTTP routes themselves (same engine, pass-through)
- [x] UI: admin tax master, program plan, payment preview; web checkout (India same-State, US + USD) — 2026-10-11 browser run, see below
- [ ] RBAC: a Dubai-scoped admin cannot see or edit EFMUM's tax rules

## Review

- [x] Diff reviewed at the requirements level against decisions 1–12 (2026-10-11)
- [x] Deep review by subagent 2026-10-11: 2 High, 5 Medium, 6 Low — all fixed in plan group 7 (none logged as open)
- [x] Specs and code are in sync: decisions 4 and 8 updated, group 7 added to the plan
- [ ] I can explain the change (read the key tests, run them under the debugger if needed)

## Open items for the CA / UAE adviser

Tracked in `requirements.md § Open Questions`. Rows 3/4 (Mahi 5% activation), 8 (HCUAE basis) and 14 (electronic service) cannot be signed off as final until answered; the system behaviour for each is configured, not coded.

## Browser run (2026-10-11, Chrome, local servers; web on :4300)

Test members 4945 (US, EFMUM), 5888 (UAE, HCUAE), 5889 (India, HCUAE). Plan 263 (`1 Session 10 Days`, INR 20000) was given a USD 250 fee through the admin plan form. Razorpay test mode, published Mastercard test number, test OTP.

| Case | Where | Result |
|------|-------|--------|
| US client, USD, LUT valid (row 5) | web checkout → Razorpay USD → paid | ✅ `Export – 0% (LUT)`; payment 5142, `EFMUM/EXP/2026-27/S/000007`, EXPORT series, PoS US, SAC 999319, LUT ARN, FBIL 95.9927 (1 Oct 2026) → INR 23998.18 stored and printed; PDF has the Rule 46 endorsement + ARN |
| India, Maharashtra (row 1) | web checkout → Razorpay INR → paid | ✅ CGST 9 + SGST 9 = 3600; payment 5143, `EFMUM/2026-27/S/000013`, PoS IN/27; PDF `Place of Supply: Maharashtra (27)` + QR |
| India, Karnataka (row 2) | web checkout → Razorpay INR → paid | ✅ IGST 18 = 3600; payment 5147, `EFMUM/2026-27/S/000014`, PoS IN/29; PDF IGST column only |
| US client, INR, DOMESTIC route (row 6) | admin preview | ✅ IGST 18%, reason "INR paid over Indian payment methods … not an export", place of supply US |
| US client, INR, SWIFT + FIRC (row 6b) | admin create → paid | ✅ switching the payment mode re-priced to 0% under LUT; payment 5145, `EFMUM/EXP/2026-27/S/000008`, route FOREIGN_REMITTANCE, reference stored; PDF endorsement + ARN, method SWIFT |
| UAE client of HCUAE, AED (row 8) | admin create → paid | ✅ VAT 0% Z, PoS AE / AE-DU; payment 5146, `HCUAE/2026/S/000006`; PDF "TAX INVOICE" + TRN, `VAT (Z) @ 0%`, AED |
| UAE client on the website (row 8) | web checkout | ✅ tax: HCUAE, `VAT 0% (zero-rated)`, USD 250 (no AED fee on 263). ❌ order 5144 was routed to EFMUM's gateway (F1 below); left PENDING, not paid |
| Tax Credit Note on `HCUAE/2026/S/000006` | admin dialog | ✅ `HCUAE/2026/CN/000004`, AED 1000, VAT Z 0%, PDF "TAX CREDIT NOTE" referencing the invoice |
| Indian client under HCUAE (row 12) | admin add-payment | ✅ toast "Indian clients must be registered under the India franchise." |
| Goods to a US delivery address (row 7) | web product checkout preview | ✅ `IGST 12% (export)`, `EXPORT_OF_GOODS`, HSN 3004, note "ON PAYMENT OF INTEGRATED TAX" (MEMUM has no LUT); not paid (live courier) |
| LUT register / tax master / plan form | admin | ✅ screens render (see A13, A20) |

### Findings (not fixed here — candidates for a plan group)

1. **F1 — franchise leak (High):** `createPublicCheckoutOrder` and `getSupportedPaymentGatewaysForCheckout` resolve the gateway from `franchiseByBusinessType(SERVICE)[0]` instead of `member.franchiseId`. A HCUAE member's order (5144, franchise 2) was created against EFMUM's Razorpay USD credentials (gateway row 4). Money for a UAE sale would settle in the Indian entity's account.
2. **F2 — international flag (High):** `CheckoutGatewayService.resolveGateway` hardcodes `isInternational: false`, so a gateway row that only supports international payments is never eligible for a foreign client. Worked around locally by setting `supports_domestic` on the USD row.
3. **F3 — public member create needs a default franchise (Medium):** `determineFranchiseByCountry` runs before the existing-member lookup and throws "No franchise found for the specified country and no default franchise is configured" for any country without a franchise (US, UK …). Production must set `mst_franchises.is_default` (add to the release runbook) and the lookup should come after the existing-member match.
4. **F4 — checkout plan lookup is paginated (Medium):** the website resolves `?plan=<id>` from `program-plan/list`, which returns 15 of 56 plans, so plans 221/224 (the ones with USD fees) show "0 items".
5. **F5 — failed billing step hides the form (Medium, web UX):** any error from member/create or calculate-tax replaces the whole billing form with "Failed to proceed" and no retry; the user must reload.
6. **F6 — plan fee of 0 accepted (Low, admin):** the program-plan form saved a USD fee of 0.
7. **F7 — admin add-payment continues after refusal (Low):** after the HCUAE/Indian-client refusal the dialog still moves to the tax step with a 0% summary; it should stay on step 1.
8. **F8 — PDF cosmetics (Low):** "Total Amount Payable" / "Total Credited" label is dark-on-dark (invisible); the exchange-rate line overlaps the totals box on the USD invoice; HCUAE "Sold By" prints ", Dubai(AE-DU)" when the street is empty; the credit-note footer says "computer-generated invoice"; the FIRC / remittance reference is not printed on export invoices; no amount-in-words line on any PDF.
9. **F9 — display nits (Low):** payment/invoice dates render as "05:30 AM" (date-only values shown with a time); franchise header shows "Financial year 4" (raw id); product page shows "₹ 1199.97.00"; plan checkout success shows product-style Packed/Shipped/Delivered steps and "Pan-India shipping".
10. **F10 — gateway config (Config):** EFMUM has no production gateway row for USD; HCUAE's Stripe row is inactive, so UAE clients cannot pay online at all. Both belong in the release runbook.

Local config made for this run (keep or revert): `mst_franchises.is_default = true` for EFMUM; `mst_franchise_payment_gateway` row 4 (EFMUM / Razorpay / USD, test credential cloned from row 1, `supports_domestic` forced on for F2); plan 263 USD fee 250; admin user `qa.super.admin@eatfit247.test` (super_admin, same password as the other QA users, unused in the end); pending web order 5144.
