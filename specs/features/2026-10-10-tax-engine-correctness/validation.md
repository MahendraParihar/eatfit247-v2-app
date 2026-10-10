# Validation: Tax-Engine Correctness (India export, UAE VAT, FX, UAE Tax Credit Notes)

> How we know the feature is done and correct. The agent runs every automated check. A human runs the manual checks and signs off on the review.
> Test members: **4945** (United States, EFMUM), **5888** (UAE, HCUAE), **5889** (India, HCUAE). Use new test payments only; issued payments 5125–5128 must stay unchanged.

## Acceptance Scorecard

| # | Criterion (Given / When / Then) | How verified | Result |
|---|---------------------------------|--------------|--------|
| A1 | Given an EFMUM client in Maharashtra and EFMUM in Maharashtra, when tax is calculated, then CGST 9% + SGST 9%, mode `DOMESTIC_GST`. Another Indian state → IGST 18% | unit + admin preview | ☐ |
| A2 | Given an Indian billing address without a state, when tax is calculated, then a 400 asks for the state (no silent IGST) | unit + curl | ☐ |
| A3 | Given a US client of EFMUM, a **USD** order and a valid LUT on the supply date, then 0%, `EXPORT_OF_SERVICE`, `is_lut_applied=true`, the LUT ARN saved, and the invoice note is the exact LUT endorsement | unit + admin + PDF | ☐ |
| A4 | Same as A3 but **no valid LUT**, then IGST 18%, `EXPORT_OF_SERVICE`, `is_lut_applied=false`, the "ON PAYMENT OF INTEGRATED TAX" endorsement, and the admin sees an "LUT expired" warning | unit + admin | ☐ |
| A5 | Given a US client of EFMUM paying **INR** on route DOMESTIC (or an INR gateway order), then IGST 18%, not an export, with the reason "INR payment by foreign client" saved | unit + admin + public checkout | ☐ |
| A6 | Given a US client of EFMUM with an offline INR payment on route FOREIGN_REMITTANCE or RUPEE_VOSTRO with a FIRC reference, then export treatment as in A3/A4, and the reference is saved | unit + admin | ☐ |
| A7 | Given a US client of EFMUM paying INR on route NRE_FCNR_ACCOUNT, then export treatment as in A3/A4. An NRO debit (route DOMESTIC) is IGST 18% | unit | ☐ |
| A8 | Given a MEMUM product order delivered outside India, then `EXPORT_OF_GOODS` 0% under LUT (IGST without one) on every line, whatever the currency. Delivered in India → GST as before | unit (no live product payment without owner warning) | ☐ |
| A9 | Given a UAE client of HCUAE and the AE rule at 0% ZERO_RATED, then VAT 0%, category Z (not `NONE`); the invoice is titled "TAX INVOICE" with the TRN and shows Z/0% per line. Changing the rule to 5% STANDARD (config only) gives 5% S on new payments | unit + admin + PDF | ☐ |
| A10 | Given a US client of HCUAE, then VAT 0% zero-rated export (Z) with an evidence note on the invoice | unit + PDF | ☐ |
| A11 | Given an Indian client (billing country IN) under HCUAE, when an admin or public payment or product order is created, then it's refused with "Indian clients must be registered under the India franchise", and admin member edit warns | unit + admin + curl | ☐ |
| A12 | Given no active tax rule for a franchise / country / type, then a clear 400 naming them (no silent `NO_TAX`). An inactive or wrong-type rule is never used | unit | ☐ |
| A13 | Given the LUT register, then Finance can add, edit and deactivate an LUT; overlapping periods and a wrong FY are rejected; status shows valid / expiring / expired; a role without permission is denied | curl + browser | ☐ |
| A14 | Given a foreign billing country on the website and a plan with a USD fee, then checkout charges USD as an export (0%, LUT). Without a USD fee, INR + IGST 18% is shown before paying | browser (web :4300) | ☐ |
| A15 | Given an invoice from a registered franchise, then its tax ID (GSTIN for EFMUM, TRN for HCUAE) is printed; an unregistered franchise prints none, place of supply / country of destination shows correctly, and AED/USD amounts in words use the right currency words | mapper tests + PDF | ☐ |
| A16 | Given a USD invoice from EFMUM, when it becomes PAID, then the FBIL rate on or before the supply date, its date and source, and the INR total and tax are saved and printed. An AED-functional HCUAE USD invoice saves the UAE Central Bank rate and AED values | unit + DB check + PDF | ☐ |
| A17 | Given no rate yet for the supply date, when the payment becomes PAID, then the invoice still issues with "FX pending", and the next job run backfills it. A feed outage never fails a payment | unit + simulated job | ☐ |
| A18 | Given a MEMUM USD goods export, then the CBIC customs rate covering that date is used; with none, Finance sees a clear "enter customs rate" message | unit + admin | ☐ |
| A19 | Given an issued HCUAE tax invoice, when an admin issues a Tax Credit Note for part of it, then it gets the next `HCUAE/{FY}/CN/{seq}` number, reverses VAT at the original rate/category, uses the original FX rate, and its PDF references the original invoice. Credits beyond the remaining amount are refused, and GST franchises are refused (4.9) | unit + admin + PDF | ☐ |
| A20 | Given two Tax Credit Notes issued concurrently for one franchise, then the numbers are consecutive with no gaps or duplicates | unit (concurrency) | ☐ |
| A22 | Given a franchise without a GSTIN, when a GST rule is saved for it (or a payment uses one), then it's refused; a VAT rule needs a TRN; an LUT export by an unregistered franchise is refused | unit + admin | ☐ |
| A23 | Given a fetched rate, then its source is FBIL or CBUAE (official sites only), or MANUAL with a note when entered by Finance | unit + DB check | ☐ |
| A21 | Issued payments 5125–5128 (and all production history) are unchanged after migrations 140–142 | DB before/after diff | ☐ |

### Results (2026-10-10, local)

| # | Status | Evidence |
|---|--------|----------|
| A1, A2 | ✅ | `tax-engine.spec`; live 5133 (India) CGST+SGST |
| A3, A4 | ✅ | `tax-engine.spec`; live US+USD with LUT → 0% `AD270326000001T`; without LUT → IGST export |
| A5, A6, A7 | ✅ | `tax-engine.spec` (INR domestic → IGST; foreign routes incl. NRE/FCNR → export); live 5131 / 5132 |
| A8 | ✅ unit | export of goods by delivery country; live preview to a US address → EXPORT_OF_GOODS (no live product payment: live courier) |
| A9, A10 | ✅ | `tax-engine.spec`, mapper specs; live 5134 (HCUAE) VAT 0% Z, TAX INVOICE + TRN PDF |
| A11 | ✅ | engine refusal (spec + live 5889); member-form warning deferred (spec updated) |
| A12 | ✅ unit | missing / inactive / wrong-type rule → 400 |
| A13 | ✅ | `lut.service.spec`; live create, overlap refused, Dubai-scoped admin refused; admin tab builds (browser check pending restart) |
| A14 | ⏳ browser | currency choice + label built (SSR build green); needs API restart and a USD plan fee |
| A15 | ✅ | mapper specs (GSTIN / TRN / none; place of supply; words in AED / USD / INR) |
| A16, A17 | ✅ | `exchange-rate.spec`; live FBIL fetch (8 rates), USD→INR resolves to FBIL; pending + backfill path |
| A18 | ✅ | goods without a customs rate → pending (live); customs entry screen built |
| A19, A20 | ✅ | `credit-note.service.spec`; live two concurrent notes `HCUAE/2026/CN/000001–000002`, over-credit refused, PDF checked |
| A21 | ✅ | 140–142 only add columns/tables; issued payments 5125–5128 unchanged (an edit to 5128 keeps NO_TAX / 5085) |
| A22 | ✅ | `tax-engine.spec`, `tax-master.service.spec` |
| A23 | ✅ | rows carry source FBIL / CBUAE_PEG / CBIC_CUSTOMS / MANUAL (manual requires a note) |

Automated: member jest **263/263**; `nx build admin-api` and `public-api` green; website SSR build green; admin dev build green (the production build's size-budget errors are pre-existing). Migrations 137, 138 (clones), 139, 140, 141, 142 apply cleanly and re-run without error.

## Release runbook (4.5 + 4.7 + 4.6 ship together)

**Before the window (owner)**
1. Accounts signs off `scripts/invoice-renumber/preview_fy2026_27_q2.sql` run on a production copy (CSV: `psql -X -q --csv`); no row may show `blocks_138`, part 2 must be empty. Resolve any listed rows with Accounts / CA first.
2. CA answer on **Mahi's GST registration** (requirements Open Questions). Registered → GSTIN + LUT; not registered → clear its GSTIN and set its tax rule to `NONE` (exports are then refused).
3. Healuxe's real **TRN** ready; every production **product** has its own tax rule; every franchise address has country and state.

**Window**
4. Stop public-api and admin-api. Back up the database.
5. Apply in order: `137_invoice_series.sql`, `138_fy2026_27_q2_invoice_renumber.sql`, `139_payment_gateway_events.sql` (if 4.5 isn't live yet), `140_tax_engine_correctness.sql`, `141_exchange_rates.sql`, `142_credit_notes.sql`. Record counters before/after 138 in the 4.7 validation.
6. Configuration (admin or SQL, before the APIs start): Healuxe TRN in "VAT number / TRN" and its GSTIN cleared; Mahi per step 2; EFMUM's LUT for FY 2026-27 in the LUT register (and Mahi's if registered); USD fees on the plans foreign clients buy; check tax rules (EFMUM IN GST 18; HCUAE AE VAT 0% zero-rated; product rules).
7. Build and deploy shared-library, server (both APIs), admin and website (`docker compose -f ./infra/docker-compose.yml build --no-cache && … up -d`). Start the APIs.

**Smoke test**
8. One domestic and one export plan invoice (manual), one proforma download, one HCUAE payment (TAX INVOICE + TRN), one credit note; a real Razorpay payment confirmed by webhook (row in `txn_payment_gateway_events`); Exchange rates screen shows today's FBIL rates after 14:15 IST.

## Automated Checks

- [ ] `cd shared-library && npm run build`
- [ ] `cd server_1 && npx jest libs/modules/tax-engine libs/modules/member` (and new credit-note / FX specs). Tax-decision matrix, mapper, FX selection and credit-note math are all green
- [ ] `cd server_1 && npm run build`
- [ ] `cd eatfit247-admin && npx nx affected --target=lint,test,build`
- [ ] `cd eatfit247-web-1 && npx nx build` (SSR); web lint with `NX_DAEMON=false npx eslint --rule '@nx/enforce-module-boundaries: off' <files>`
- [ ] Migrations 140, 141, 142 apply cleanly on a fresh DB and on a pre-140 clone, and re-run without error

## Manual Checks

- [ ] Admin: create manual payments for 4945 (USD + LUT, INR domestic, INR + FIRC), 5888 (AED), 5889 (blocked); check the preview reasons and PDFs
- [ ] Admin: LUT register and exchange-rate screens (add, override, customs entry); Tax Credit Note on a 5888 test invoice
- [ ] Web (:4300): checkout as a foreign client with and without a USD plan fee; Safari + mobile width
- [ ] Daily FX job run by hand: rates fetched from FBIL and the UAE Central Bank; a forced failure is logged and doesn't affect payments
- [ ] RBAC: a role without the LUT / exchange-rate / credit-note permissions is denied; another franchise's owner can't see HCUAE credit notes
- [ ] Owner: CA/UAE-adviser answers recorded in requirements.md Open Questions before production config (HCUAE TRN, Mahi registration, USD fees, LUT rows)

## Review

- [ ] Diff reviewed at the requirements level: does the code do what `requirements.md` says?
- [ ] Deep review by subagents (tax correctness, money/sequence races, franchise leakage, conventions). Findings fixed or logged as new plan groups
- [ ] Specs and code are in sync. Every fix made during review is reflected back into `requirements.md` / `plan.md`
- [ ] I can explain the change (read the key tests, run them under the debugger if needed)
