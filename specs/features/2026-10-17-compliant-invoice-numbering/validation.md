# Validation: Compliant Invoice Numbering and Unregistered Turnover Warning

> How we know the feature is done and correct. The agent runs every automated check. A human runs the manual checks and signs off on the review.

## Acceptance Scorecard

| # | Criterion (Given / When / Then) | How verified | Result |
|---|---------------------------------|--------------|--------|
| A1 | Given migrations 137–145 applied, when 145 runs a second time, then there is no error and no duplicate payment modes, and EFMUM/MEMUM keep any prefix or template already set | SQL | ✅ 2026-10-17 clone `eatfit_rh145`: re-run clean, 21 modes / 21 distinct, owner-set prefix/template/threshold kept |
| A2 | When 138 is run, then it aborts with the "retired" message and no row or counter changes | SQL | ✅ 2026-10-17 clone: aborts "Retired…", md5 of counters and invoice numbers identical before/after |
| A3 | Given EFMUM's domestic service counter for 2026-27 is N, when a domestic plan payment becomes PAID, then its number is `EFM/2627/S/{N+1, 5 digits}` and the counter is N+1 | jest + live | ✅ jest; live service-level (rolled back) `EFM/2627/S/00492` after 491 — real PAID payment pending |
| A4 | Given no EFMUM export counter for 2026-27, when an export of service (LUT or IGST-paid) becomes PAID, then its number is `EFM/2627/E/00001` | jest + live | ✅ jest; live service-level `EFM/2627/E/00001` — real PAID payment pending |
| A5 | When a MEMUM product order becomes PAID, then the number is `MEM/2627/P/{next}`, continuing MEMUM's counter | jest | ✅ jest `MEM/2627/P/00065` (and live service-level) |
| A6 | When an HCUAE payment becomes PAID, then the number keeps the legacy format `HCUAE/2026/S/{6 digits}` | jest + live | ✅ jest; live service-level `HCUAE/2026/S/000012` — real PAID payment pending |
| A7 | Every number issued for EFMUM and MEMUM is at most 16 characters and matches `^[A-Za-z1-9][A-Za-z0-9/-]{0,15}$` | jest (property over all type letters and sequence 1…99999) | ✅ util spec: EFM/MEM × S/E/P/X/C × 1…99999 |
| A8 | Given a template that can exceed 16 characters (e.g. `{PREFIX}-{FY}-{TYPE}-{SEQ7}` with `EFMUM`), when it is saved for an Indian franchise, then the API returns 400 listing the reason, and the form shows it before submit | jest + browser | API ✅ (jest + live 400); form check pending (group 5) |
| A9 | Given an invalid template forced into the DB, when an invoice is issued, then issuing fails, the transaction rolls back, and the counter is unchanged (no gap) | jest | ✅ jest: guard throws before the counter is saved; live: refused number not consumed |
| A10 | After go-live, no invoice issued before 145 has a changed `invoice_id`, `invoice_series`, `invoice_date` or tax column (row hash before and after) | SQL | ☐ |
| A11 | A foreign client paying INR over Indian rails (IGST, `DOMESTIC_GST`) gets an `S` number, and a foreign-remittance payment gets an `E` number | jest + live | ☐ |
| A12 | New payment modes exist with route `FOREIGN_REMITTANCE`. Picking one for a foreign client prices the payment as an export, and the domestic-mode hint shows when the billing country is not India | live + browser | ☐ |
| A13 | Given MEMUM with no GSTIN and a ₹40 lakh threshold, when FY turnover is 79% / 80% / 100%, then the level is NONE / AMBER / RED on the endpoint and the UI | jest + browser | jest ✅ (79.99 / 80 / 100, plus 99.99… stays amber); live endpoint values ✅; UI pending (group 5) |
| A14 | Given AMBER already emailed this FY, when the cron runs again at the same level, then no email is sent. When it crosses to RED, exactly one email is sent. In a new FY the level restarts | jest | ✅ jest (cron spec: once per level, red once, new FY restarts, failed send retried) |
| A15 | Given a franchise with a GSTIN, then no turnover warning is shown or emailed | jest | ✅ jest (service and cron) |
| A16 | A franchise admin of another franchise cannot read MEMUM's turnover (403 / scoped) | curl | ☐ |
| A17 | Given EFMUM issued `EFMUM/2026-27/S/000480…000491` and then `EFM/2627/S/00492…00495` in October, when Documents issued runs for October, then there are two "Invoices for outward supply" rows with those exact from/to values and correct totals | jest + live | ✅ jest (old 480–491 + new 492–495 → two rows); live: old format only so far (no new-format invoice issued yet) |
| A18 | Given an issued invoice later made inactive or no longer PAID, then it counts in Total number and in Cancelled, and Net issued = Total − Cancelled | jest | ✅ jest; live EFMUM Q1 202 issued / 1 cancelled / 201 net |
| A19 | Given a missing sequence inside a series in the period, then the row is flagged and lists the missing number | jest | ✅ jest; live flagged real gaps (see Review: EFMUM 461–464) |
| A20 | The CSV matches the screen. A user without Report read gets 403. Another franchise's admin sees only their own franchise. MEMUM without a GSTIN shows the "not a tax invoice; not reported" banner | curl + browser | API ✅ (CSV = rows, 403 for another franchise's admin, `reportable=false` without GSTIN, via service live + jest); curl without Report read and the browser banner pending (group 5) |
| A21 | Given go-live, when a plan is bought on the website (gateway webhook) and another is entered in admin, then both get new-format numbers from the same counter, in issue order; no row issued before go-live changes | jest (payment-confirmation + invoice-on-paid) + live | ☐ |

## Automated Checks

- [ ] `cd shared-library && npm run build` (and the util spec)
- [ ] `cd server_1 && npx nx affected --target=lint,test,build` (member jest stays green, plus the new cases)
- [ ] `cd eatfit247-admin && npx nx affected --target=lint,test,build` (development build; production budget errors are pre-existing)
- [ ] Migrations 137–145 apply on a fresh DB and on a copy of production data. 138 aborts as retired

## Manual Checks

- [ ] API: issue a domestic, an export and an HCUAE payment locally and record the numbers; `curl` the turnover endpoint (happy path + other-franchise 403)
- [ ] UI: franchise form preview and error; turnover badge on list, details and dashboard; payment-form remittance hint; Documents issued report and CSV (October 2026 on local data)
- [ ] PDF: a new-format invoice downloads as `Invoice-EFM-2627-S-…pdf` and prints the number in full
- [ ] RBAC: a role without Franchise update cannot change the format

## Review

- [ ] Diff reviewed against requirements decisions 1–15
- [ ] Deep review by subagents (numbering gaps and races, franchise leakage, conventions). Findings fixed or logged
- [ ] Specs and code in sync; 4.7 and the runbook updated (plan group 0)
- [ ] I can explain the change

- **2026-10-17 Table 13 live run (Accounts / CA to decide):** EFMUM `EFMUM/2026-27/S/000463` (payment 5246, paid 30 Sep) and `…000464` (payment 5247, paid 25 Aug) were entered and numbered on 8 Oct, after `…000461` / `…000462` (7 Oct). By payment date, Q2 runs `000203…000464` missing 461–462 and October runs `000461…000491` missing 463–464. Nothing is changed (decision 1); Accounts decide which return lists 463–464 and, if the Q2 return is already filed, whether it needs an amendment.
