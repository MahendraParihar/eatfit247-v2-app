# Validation: Compliant Invoice Numbering and Unregistered Turnover Warning

> How we know the feature is done and correct. The agent runs every automated check. A human runs the manual checks and signs off on the review.

## Acceptance Scorecard

| # | Criterion (Given / When / Then) | How verified | Result |
|---|---------------------------------|--------------|--------|
| A1 | Given migrations 137–145 applied, when 145 runs a second time, then there is no error and no duplicate payment modes, and EFMUM/MEMUM keep any prefix or template already set | SQL | ✅ 2026-10-17 clone `eatfit_rh145`: re-run clean, 21 modes / 21 distinct, owner-set prefix/template/threshold kept |
| A2 | When 138 is run, then it aborts with the "retired" message and no row or counter changes | SQL | ✅ 2026-10-17 clone: aborts "Retired…", md5 of counters and invoice numbers identical before/after |
| A3 | Given EFMUM's domestic service counter for 2026-27 is N, when a domestic plan payment becomes PAID, then its number is `EFM/2627/S/{N+1, 5 digits}` and the counter is N+1 | jest + live | ✅ jest; live 2026-10-17: admin payment 5278 (member 4945, IN, UPI) → `EFM/2627/S/00492`, counter 491 → 492 |
| A4 | Given no EFMUM export counter for 2026-27, when an export of service (LUT or IGST-paid) becomes PAID, then its number is `EFM/2627/E/00001` | jest + live | ✅ jest; live: payment 5280 (US billing, mode "Remittance via exchange house (RDA)") → `EFM/2627/E/00001`, `EXPORT_OF_SERVICE`, IGST (no local EFMUM LUT, decision 11) |
| A5 | When a MEMUM product order becomes PAID, then the number is `MEM/2627/P/{next}`, continuing MEMUM's counter | jest | ✅ jest `MEM/2627/P/00065` (and live service-level) |
| A6 | When an HCUAE payment becomes PAID, then the number keeps the legacy format `HCUAE/2026/S/{6 digits}` | jest + live | ✅ jest + live service-level (`HCUAE/2026/S/000012`, rolled back). A real HCUAE payment is blocked locally by its missing TRN (runbook step 6), unrelated to this feature |
| A7 | Every number issued for EFMUM and MEMUM is at most 16 characters and matches `^[A-Za-z1-9][A-Za-z0-9/-]{0,15}$` | jest (property over all type letters and sequence 1…99999) | ✅ util spec: EFM/MEM × S/E/P/X/C × 1…99999 |
| A8 | Given a template that can exceed 16 characters (e.g. `{PREFIX}-{FY}-{TYPE}-{SEQ7}` with `EFMUM`), when it is saved for an Indian franchise, then the API returns 400 listing the reason, and the form shows it before submit | jest + browser | ✅ API (jest + live 400) and form (browser: error shown before submit, form blocked) |
| A9 | Given an invalid template forced into the DB, when an invoice is issued, then issuing fails, the transaction rolls back, and the counter is unchanged (no gap) | jest | ✅ jest: guard throws before the counter is saved; live: refused number not consumed |
| A10 | After go-live, no invoice issued before 145 has a changed `invoice_id`, `invoice_series`, `invoice_date` or tax column (row hash before and after) | SQL | ✅ rehearsal 2026-10-17: md5 of every plan payment ≤ 5277 and every product order (number, series, date, tax mode, tax, total, payment date) identical in `eatfit` and the untouched clone `eatfit_rh145`. Re-run on production at release |
| A11 | A foreign client paying INR over Indian rails (IGST, `DOMESTIC_GST`) gets an `S` number, and a foreign-remittance payment gets an `E` number | jest + live | ✅ live: payment 5279 (US billing, Cash, INR) → `DOMESTIC_GST` IGST, `EFM/2627/S/00493`; payment 5280 (RDA) → `E/00001` |
| A12 | New payment modes exist with route `FOREIGN_REMITTANCE`. Picking one for a foreign client prices the payment as an export, and the domestic-mode hint shows when the billing country is not India | live + browser | ✅ modes 21/22 FOREIGN_REMITTANCE (SQL); browser: hint with Cash for a US-billed member, gone with the RDA mode; tax pricing by route was already covered by 4.6 |
| A13 | Given MEMUM with no GSTIN and a ₹40 lakh threshold, when FY turnover is 79% / 80% / 100%, then the level is NONE / AMBER / RED on the endpoint and the UI | jest + browser | ✅ jest (79.99 / 80 / 100, plus 99.99… stays amber); live endpoint; browser chip + card + dashboard at 88.78% amber |
| A14 | Given AMBER already emailed this FY, when the cron runs again at the same level, then no email is sent. When it crosses to RED, exactly one email is sent. In a new FY the level restarts | jest | ✅ jest (cron spec: once per level, red once, new FY restarts, failed send retried) |
| A15 | Given a franchise with a GSTIN, then no turnover warning is shown or emailed | jest | ✅ jest (service and cron) |
| A16 | A franchise admin of another franchise cannot read MEMUM's turnover (403 / scoped) | curl | ✅ curl 2026-10-17: `qa.franchise.admin` (franchise 1) → 403 on franchise 3 turnover and counters; `qa.nutritionist.f2` → 403; `qa.social` (no Franchise read) → 403 |
| A17 | Given EFMUM issued `EFMUM/2026-27/S/000480…000491` and then `EFM/2627/S/00492…00495` in October, when Documents issued runs for October, then there are two "Invoices for outward supply" rows with those exact from/to values and correct totals | jest + live | ✅ jest (old 480–491 + new 492–495 → two rows); live: old format only so far (no new-format invoice issued yet) |
| A18 | Given an issued invoice later made inactive or no longer PAID, then it counts in Total number and in Cancelled, and Net issued = Total − Cancelled | jest | ✅ jest; live EFMUM Q1 202 issued / 1 cancelled / 201 net |
| A19 | Given a missing sequence inside a series in the period, then the row is flagged and lists the missing number | jest | ✅ jest; live flagged real gaps (see Review: EFMUM 461–464) |
| A20 | The CSV matches the screen. A user without Report read gets 403. Another franchise's admin sees only their own franchise. MEMUM without a GSTIN shows the "not a tax invoice; not reported" banner | curl + browser | ✅ CSV = rows (curl, UTF-8 BOM); `qa.social` / `qa.nutritionist.f2` (no Report read) → 403 on report and CSV; `qa.franchise.admin` → 403 for franchise 3; banner in the browser |
| A21 | Given go-live, when a plan is bought on the website (gateway webhook) and another is entered in admin, then both get new-format numbers from the same counter, in issue order; no row issued before go-live changes | jest (payment-confirmation + invoice-on-paid) + live | ✅ live: website checkout (web :4300, plan 246, Razorpay TEST card, member 6394 `qa.web.checkout@eatfit247.test`) → payment 5281 `PAYMENT_GATEWAY` / `RAZORPAY` `EFM/2627/S/00494`, the same counter right after the admin payments 492–493; no earlier row changed (A10) |

## Automated Checks

- [x] `cd shared-library && npm run build` (and the util spec: 24/24 incl. A7)
- [x] server_1 tests and builds (2026-10-17): member 321, franchise 32, reports 17, platform 24 (`google.service.spec` fails as before); `admin-api` + `public-api` builds green. server_1 has no lint target
- [x] admin: `tsc` and development build green; ESLint on the changed files 0 errors (older `any` warnings only)
- [x] Migrations 137, 139–145 on a production copy (clone, then `eatfit`): clean, re-run clean, 138 aborts as retired. A fresh empty DB was not tried

## Manual Checks

- [x] API: domestic `EFM/2627/S/00492`, foreign-client INR `S/00493`, export `E/00001`, website `S/00494`; HCUAE service-level only (TRN missing locally); turnover curl 200 / 403
- [x] UI: all of these in Chrome 2026-10-17 (plan group 5 as-built)
- [x] PDF: `Invoice-EFM-2627-S-00492-Mahendra-Parihar.pdf`, prints `Invoice No: EFM/2627/S/00492`, CGST + SGST
- [x] RBAC: `qa.nutritionist.f2` / `qa.social` → 403 on `PUT franchise/manage/1`; a franchise admin outside the franchise → 403 after group 5b

## Review

- [x] Diff reviewed against requirements decisions 1–15 (2026-10-17, spec-conformance reviewer): 1, 2, 4, 5, 8–11, 14 and 15 satisfied as written; gaps in 3, 6, 7 and 13, and the currency issue in 12, fixed in group 7
- [x] Deep review by subagents (2026-10-17: numbering, isolation and security, turnover and Table 13, spec and conventions). Every finding re-verified, R1–R10 fixed in group 7, pre-existing RBAC items and accepted risks logged in plan group 7
- [x] Specs and code in sync; 4.7 and the runbook updated (plan group 0). Deviations found while building went into plan.md / requirements.md before the code: 2.1 `{PREFIX}` required, 3.4 prefix uniqueness, 4.1 payment-date fallback and email template, 4b.1 nature by source table, 5.1 counters endpoint, 5b scope. The review found gaps that had not been recorded: the guard skipped legacy numbers, and `{FY}` and the `{SEQn}` position were not required. These were amended in decisions 3, 6, 7, 12 and 13 and fixed in group 7.
- [ ] I can explain the change

- **2026-10-17 Table 13 live run (Accounts / CA to decide):** EFMUM `EFMUM/2026-27/S/000463` (payment 5246, paid 30 Sep) and `…000464` (payment 5247, paid 25 Aug) were entered and numbered on 8 Oct, after `…000461` / `…000462` (7 Oct). By payment date, Q2 runs `000203…000464` missing 461–462 and October runs `000461…000491` missing 463–464. Nothing is changed (decision 1); Accounts decide which return lists 463–464 and, if the Q2 return is already filed, whether it needs an amendment.
- **2026-10-17 monthly view:** by payment date the August and September ranges interleave (`000377…000463` in September with 35 numbers dated August): 34 payments entered in September carry August payment dates, and the old invoices print the payment date. Monthly Table 13 for FY 2026-27 months before go-live will show gaps; quarterly it is 2 (461–462). From go-live `invoice_date` is the issue date, so ranges are contiguous. Accounts decide how to report the pre-go-live months.
- **2026-10-17 local test data left in `eatfit`:** QA admin users from `scripts/dev/qa-test-admin-users.sql` (incl. `qa.super.admin`); address 5857 "QA US billing" on member 4945; member 6394 `qa.web.checkout@eatfit247.test` with address 5859 "QA UAE billing"; payments 5278–5281 (counters EFMUM service DOMESTIC 494, EXPORT 1).
- **2026-10-17 combination run (admin UI on localhost, dummy member 6395 `qa.combo@eatfit247.test`, created in the admin; test LUT `AD270426999999T` for EFMUM FY 2026-27 added in the LUT Register).** Each invoice PDF was rendered and read:
  - Karnataka client, UPI: `EFM/2627/S/00495`, IGST 900, place of supply Karnataka (29).
  - US client, international card (e-FIRA): `EFM/2627/E/00002`, 0% under LUT, LUT endorsement and ARN printed.
  - US client, NRE / FCNR: `EFM/2627/E/00003`, 0% under LUT.
  - US client, Vostro, created PENDING with no number, then edited to PAID: `EFM/2627/E/00004`, 0% under LUT.

  Counters: EFMUM DOMESTIC 495, EXPORT 4. Not covered locally:
  - an export paid in USD (no USD fee or USD gateway locally);
  - HCUAE invoices (no TRN locally);
  - Mahi product orders (a PAID order books a live NimbusPost shipment);
  - GST credit notes (roadmap 4.9).
