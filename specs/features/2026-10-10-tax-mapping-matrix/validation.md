# Validation: Tax Mapping Matrix

> How we know the feature is done and correct. The agent runs every automated check. A human runs the manual checks and signs off on the review.

## Acceptance Scorecard

Row numbers refer to the mapping table in `requirements.md`.

| # | Criterion (Given / When / Then) | How verified | Result |
|---|---------------------------------|--------------|--------|
| A1 | Fresh DB after 137–144 → `mst_tax_master` holds EFMUM IN SERVICE GST 18 (999319), HCUAE AE SERVICE VAT 0 Z, and per active product one active `NONE` + one inactive `GST_5` row for MEMUM, each with `legal_basis` | SQL | ☐ |
| A2 | 144 applied twice, and once on a DB with hand-entered EFMUM/HCUAE rules → no error, no duplicate rules | SQL | ☐ |
| A3 | Row 1: EFMUM, Maharashtra billing → CGST 9 + SGST 9, `place_of_supply_state_code = '27'` stored | test + curl | ☐ |
| A4 | Row 2: EFMUM, Karnataka billing → IGST 18, state code stored | test + curl | ☐ |
| A5 | Rows 3/4 with the staged `GST_5` row active: same-State delivery → CGST 2.5 + SGST 2.5; other State → IGST 5; HSN from the rule on the line | test | ☐ |
| A6 | Rows 3/4 with MEMUM `NONE` active: same-State delivery → no tax, plain invoice; other-State delivery → 400 s.24(i) unless `ALLOW_UNREGISTERED_INTERSTATE_GOODS` | test + curl | ☐ |
| A7 | Row 5: US + USD + valid LUT → 0%, EXPORT series, place of supply country `US`, state null | test | ☐ |
| A8 | Row 5b: US + USD, LUT expired → IGST 18, EXPORT series, "on payment of IGST" | test | ☐ |
| A9 | Row 6: US + INR DOMESTIC → IGST 18, DOMESTIC series, reason stored | test | ☐ |
| A10 | Row 7: goods delivered to AE, LUT valid → EXPORT_OF_GOODS 0%; without LUT → IGST at rule rate | test | ☐ |
| A11 | Row 8: HCUAE, AE client → VAT 0 Z today; flipping the rule to 5 STANDARD gives VAT 5 S without a deploy | test + admin | ☐ |
| A12 | Row 10: HCUAE, US client → VAT 0 Z with the services note; row 11/13 goods → goods note and "delivery address" reason | test | ☐ |
| A13 | Row 12: HCUAE, India billing → 400 "Indian clients must be registered under the India franchise" | test + curl | ☐ |
| A14 | Row 14: plan with `is_electronic_service = true` sold by EFMUM to AE → same result as row 5/6 (flag stored, no engine change) | test | ☐ |
| A15 | Per-plan reference: a SERVICE rule for `reference_id = <planId>` wins; with none, the `reference_id = 1` row applies | test | ☐ |
| A16 | Supply date for HCUAE evaluated in `Asia/Dubai` (LUT / rule validity at 23:30 Dubai time does not use the next IST day) | test | ☐ |
| A17 | Rounding: for an odd tax amount CGST + SGST equals the total tax exactly; totals equal the sum of printed lines | test | ☐ |
| A18 | Invoice PDF prints place of supply from the stored codes; editing the member's address afterwards and re-downloading leaves it unchanged | browser | ☐ |
| A19 | Functional currency for a franchise comes from `mst_countries.currency_code` (no `'AE'` literal) | test | ☐ |
| A20 | Admin tax-master list shows HSN/SAC and legal basis; program-plan form has the electronic-service toggle; deprecated fields hidden | browser | ☐ |
| A21 | Website shows one consistent tax statement on product, checkout, seasonal plans and FAQ; State field carries the place-of-supply hint | browser (Safari + mobile width) | ☐ |
| A22 | Matrix spec covers every row 1–14 and variant; member jest green | jest | ☐ |

## Automated Checks

- [ ] `cd shared-library && npm run build`
- [ ] `cd server_1 && npx nx affected --target=lint,test,build`
- [ ] `cd eatfit247-admin && npx nx affected --target=lint,test,build`
- [ ] `cd eatfit247-web-1 && npx nx build` (SSR build)
- [ ] Migration 144 applies cleanly on a fresh DB and on a copy of production data (twice)

## Manual Checks

- [ ] API: `POST /member/{id}/payment-history/calculate-tax` and `POST /member/{id}/product/calculate-tax` for rows 1, 2, 5, 6, 12 and the s.24(i) refusal
- [ ] UI: admin tax master, program plan, payment preview; web checkout (India same-State, US + USD)
- [ ] RBAC: a Dubai-scoped admin cannot see or edit EFMUM's tax rules

## Review

- [ ] Diff reviewed at the requirements level: does the code do what `requirements.md` says?
- [ ] Deep review by subagents (bugs, security / franchise leakage, conventions). Findings fixed or logged
- [ ] Specs and code are in sync. Every fix made during review is reflected back into `requirements.md` / `plan.md`
- [ ] I can explain the change (read the key tests, run them under the debugger if needed)

## Open items for the CA / UAE adviser

Tracked in `requirements.md § Open Questions`. Rows 3/4 (Mahi 5% activation), 8 (HCUAE basis) and 14 (electronic service) cannot be signed off as final until answered; the system behaviour for each is configured, not coded.
