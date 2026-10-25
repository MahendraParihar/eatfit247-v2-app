# Validation: Configurable Tax Treatment

> How we know the feature is done and correct. The agent runs every automated check. A human runs the manual checks and signs off on the review.

## Acceptance Scorecard

| # | Criterion (Given / When / Then) | How verified | Result |
|---|---------------------------------|--------------|--------|
| A1 | Given the local DB after step 1.0 with migrations ≤145, when 146 runs, then: EFMUM has one GST registration (State 27, INR) and HCUAE one VAT registration (the test TRN, AED); MEMUM has none; existing rules are SAME_COUNTRY / CHARGE (reference-1 service rows = ALL, product rows SPECIFIC); the seeds exist; a second run changes nothing | SQL (clone) | ✅ 2026-10-25 group 1b: fresh clone of the post-1.0 DB: EFMUM GST 27 INR, HCUAE VAT test TRN AED, MEMUM none; 4 existing rules SAME_COUNTRY / CHARGE (rows 1–2 ALL, 3–4 SPECIFIC); 7 seeds; second run identical (data, schema, constraints, indexes) |
| A2 | Given a clone where two Indian franchises hold the same GSTIN, when 146 runs, then it aborts with the "duplicate GSTIN" message and nothing changes. A GSTIN on the UAE franchise is skipped with a NOTICE | SQL (clone) | ✅ 2026-10-25 group 1b: pre-1.0 clone (EFMUM + MEMUM share the GSTIN) aborts with the duplicate-GSTIN message, snapshot identical; with MEMUM cleared, HCUAE's GSTIN gives the NOTICE and is skipped |
| A3 | Before and after each migration (146–149) and each gate: every invoice issued before the feature has an identical row hash (number, series, date, tax mode, tax, total). `mst_invoice_sequences` keeps the same key set (franchise, type, FY, series; after 149, with `tax_registration_id` NULL on every existing row), and every `current_number` is ≥ its value before (only test payments advance it) | SQL | 146 ✅ 2026-10-25: 5,249 payments, 93 orders, 6 counters identical on the clones and on `eatfit` (no credit notes locally); 147–149 still to run |
| A4 | **Equivalence:** the matrix rows 1–14 pass with their **expected tax outputs unedited**, on the seeded rules; only the harness, the mocks and the row 4 assertion (now rule-based) change; row 12 still refuses before any rule lookup; the tax suite is fully green (89/89 after the group 0 test fix) | jest | ☐ |
| A5 | Given HCUAE's seeded "any foreign services → zero-rated export", when the owner (super admin or HCUAE's franchise admin) changes it to `CHARGE` 5% STANDARD with a legal basis, then a US client is charged VAT 5% S, with no code change | jest + live (preview + admin payment) | ☐ |
| A6 | Precedence (D4): "customer SA → CHARGE 5%" beats "any foreign, money FOREIGN → zero-rated" for an SA client; "any foreign, electronic YES" does not beat "customer SA"; MEMUM's "same country, other State, unregistered → REFUSE" beats the product-specific CHARGE row; a plan-specific rule beats an all-plans rule only when their conditions are equal | jest (util + engine) + preview | util ✅ 2026-10-25 (group 2b: SA vs any-foreign money / electronic, row 4 REFUSE over the product row, plan-specific vs all, D4 order pinned); engine + preview from groups 5–6 |
| A7 | Two active rules equal on dimensions 1–7 with the **same** `effective_from` → the second save is refused (400 naming the conflict). The same rule with a **later** `effective_from` saves and takes over from that date | jest + curl | util ✅ 2026-10-25 (same date = duplicate, later date supersedes); save 400 from group 5 |
| A8 | Guardrails (D7): each hard block returns 400; each warning case without a legal basis returns 400 listing the warnings, and with a legal basis it saves and returns them | jest + curl + browser | ☐ |
| A9 | MEMUM unregistered: goods to another State (or an unknown State) are refused by the seeded rule, with no `mst_configs` read; when the owner changes that rule to `CHARGE`, the sale is priced without GST; a same-State sale is priced without GST | jest + live | ☐ |
| A10 | The Indian-client refusal is a code invariant: an Indian billing client under HCUAE, or under a newly created non-Indian franchise with no rules, is refused before any rule lookup; no rule overrides it | jest | ☐ |
| A11 | A default goods rule (`applies_to = ALL`) prices a new product without its own rule; a product-specific rule with equal conditions still wins | jest | ☐ |
| A12 | a) Saving "customer AE, electronic → FOREIGN_REGISTRATION" for EFMUM without a UAE registration is blocked. b) Before group 10, a matching `FOREIGN_REGISTRATION` rule refuses the sale with a clear message | jest + curl | ☐ |
| A13 | Given EFMUM with an active UAE registration (test TRN, AED, own prefix), the A12 rule and a test plan with an AED fee: an AE client's electronic plan made PAID gives VAT 5% S in AED; the invoice prints "TAX INVOICE" and the UAE TRN; the number is the registration's first number in its own counter (series DOMESTIC); EFMUM's existing DOMESTIC / EXPORT counters are unchanged; the books record the INR equivalent. A plan without an AED fee is refused | jest + live + PDF | ☐ |
| A14 | A credit note on the A13 invoice is numbered in the registration's own `C` counter, prints the UAE seller block and reverses the AED VAT | jest + live | ☐ |
| A15 | Documents issued: rows with the foreign `tax_registration_id` are excluded from EFMUM's GSTIN report and listed under the registration, with a gap check | jest + live | ☐ |
| A16 | Given a customer GSTIN with State 29 and a billing address in State 27 for an EFMUM service, then IGST, place-of-supply State 29 stored, `customer_type` = B2B, and the buyer GSTIN printed | jest + live + PDF | ☐ |
| A17 | An invalid GSTIN (checksum or State), a TRN that isn't 15 digits, or a GSTIN on a non-Indian billing address → 400 on admin payment and order create, and on payment update when the value changes; the admin form shows the error before submit | jest + curl + browser | ☐ |
| A18 | Admin HCUAE payment, billing US, with an evidence mismatch (declaration unticked, UAE dial code, or UAE payer account): `calculate-tax` (create) or `preview-update` (edit) shows the mismatch; save without a decision → 409 with the `TAX_EVIDENCE_DECISION_REQUIRED` message; `KEEP` + reason stores 0% Z and the decision (user, time, reason); `APPLY_FALLBACK` prices with the fallback-only rule (5% S); consistent evidence saves at 0% Z with status OK; an unknown dial code is `NOT_AVAILABLE` | jest + live + browser | ☐ |
| A19 | *Deferred until online payments return* (website fallback quote) | – | n/a |
| A20 | *Deferred until online payments return* (after-payment card check) | – | n/a |
| A21 | An export-mode product order accepts export documents, which are stored and shown; a non-export order → 400; an export order without documents 30 days after its first `IN_TRANSIT` event is flagged | jest + SQL + browser | ☐ |
| A22 | Tax preview returns the winning rule, the runners-up and any shadowing warning (and, from group 6, the computed tax), saves nothing, and is franchise-scoped | jest + curl + browser | ☐ |
| A23 | RBAC: a) Tax Master: super admin reads and edits all franchises; `qa.franchise.admin` reads and edits only their own (403 elsewhere); nutritionist / finance / delivery read only their own; a role without Read → 403. b) Registrations: same. c) Preview: scoped. d) Evidence decision: only `TaxEvidence` holders (super admin, financial manager); a nutritionist → 403. e) Email templates: only `EmailTemplate` holders (super admin); `qa.franchise.admin` → 403 | curl (QA users) | a ✅ 2026-10-25 (group 3b: super admin all, also when mapped; `qa.franchise.admin` own only, 403 elsewhere; `qa.nutritionist.f2` reads own only; `qa.social` 403); b–e from groups 4, 5, 10, 8 |
| A24 | No tax decision or feature switch reads `mst_configs` except `DIET_SAC_CODE`: the five D15 rows (`ALLOW_UNREGISTERED_INTERSTATE_GOODS`, `GST_ENABLED`, `TAX_PERCENTAGE`, `SEND_WELCOME_MAIL`, `SEND_DIET_MAIL`) have `module = 'Retired'`; their `ConfigParam` entries and readers are gone (grep); `DIET_SAC_CODE` is still loaded; the APIs boot | grep + SQL + boot | ☐ |
| A25 | Every sale priced after group 6 stores `tax_master_id` and `tax_registration_id` (NULL when unregistered); editing or deactivating that rule afterwards doesn't change the stored record or its PDF | jest + live | ☐ |
| A26 | With `member_diet_plan.send_email_notification = false` (switched in the Email Templates screen), the diet-plan event sends no email; with true it sends | jest (listener) + live | ☐ |
| A27 | Admin payment master data has `taxApplicable` true for an EFMUM member and false for a MEMUM member (computed from registrations); the franchise form loads and saves without the master-data flag; a pre-144 payment PDF still prints SAC 999319 from `DIET_SAC_CODE` (unchanged) | jest + live | ☐ |
| A28 | A legacy payment holding an invalid `gst_number` (`456789`) can still be edited (notes, amount) without a validation error | jest + live | ☐ |
| A29 | EFMUM admin payment with route DOMESTIC and a foreign payer account: a warning is shown; the tax stays as the route decides (IGST / domestic) | jest + browser | ☐ |
| A30 | After 146: `mst_franchises.currency_code` is INR for EFMUM and MEMUM and AED for HCUAE; invoice issue records the functional currency from it; changing it on the franchise form affects only invoices issued afterwards | SQL + jest + live | data ✅ 2026-10-25 (EFMUM INR, HCUAE AED, MEMUM INR); invoice issue from group 4 |
| A32 | Welcome email: after 149 `member_welcome.active = false` and creating a member sends nothing; after a super admin activates it in the Email Templates screen, the next member create sends one welcome email (and WhatsApp when its switch is on) through `member/welcome.ejs`; a duplicate `member.created` event sends no second mail | jest + live (mail log) | ☐ |
| A33 | Every active franchise has its invoice counters for its current FY (EFMUM, MEMUM and HCUAE, each business type and series it can use; unused ones at 0, plus the credit-note counter) and the admin counters view lists them; a foreign registration's counters sit under its franchise; existing counter values are unchanged | SQL + curl + browser | ☐ |
| A34 | No counter, no entry: with the needed counter missing, a PAID payment create, an edit to PAID, a PAID product order and a credit note each get a 409 `INVOICE_COUNTER_MISSING` naming the counter; no payment / order / credit-note row is written and no counter changes; `calculate-tax` reports it before save; a PENDING entry still saves. After an admin creates the counter, the same entry succeeds with number 1 (or the starting number) | jest + curl + SQL + browser | ☐ |
| A35 | Counters are created only by migration 150 or the admin (super admin any franchise, franchise admin own, others 403); a starting number is refused when an invoice exists in that key; no update or delete endpoint exists; "create next FY counters" copies the current set at 0; the reminder emails super admins once, 30 days before the franchise's FY start, when a next-FY counter is missing | jest + curl + SQL | ☐ |
| A31 | A `fallback_only` rule is never matched directly (an otherwise matching sale ignores it), is exempt from the duplicate check against its normal twin, and is accepted as a fallback; a normal rule chosen as a fallback is refused | jest + curl | util ✅ 2026-10-25 (fallback-only never matched, exempt from duplicates); save checks from group 5 |

## Gate Log

Hill climbing (plan.md § How this plan is built): a group is done only when its own gate passes **and** every earlier gate plus the baseline still pass. One row per gate run; a red run is logged too.

| Group | Owns | Date | New checks | Regression (baseline + earlier gates) | Result |
|-------|------|------|------------|----------------------------------------|--------|
| 0 Docs + green baseline | baseline 89/89 | 2026-10-25 | tax 89/89 after the 0.4 clock fix; 37 spec links resolve | first run **red**: tax 88/89 (credit-note date bomb), platform `google.service.spec` failed to load, `npm run lint` 5 errors (removed `no-extra-semi` rule); replanned as 0.5–0.7 | ☐ red |
| 0 Docs + green baseline | baseline 89/89 | 2026-10-25 | as above | member 322, franchise 36, reports 20, platform 36/36; shared-library build, lint (0 errors) and build green | ✅ |
| 1 Migration 146 | A1, A2, A3, A30 (data) | 2026-10-25 | A1, A2, A3, A30 data on clones; 29 constraint cases; `eatfit`: 12 calculate-tax cases byte-identical before / after; tax 90/90 | baseline green (member 323, franchise 36, reports 20, platform 36, lint, build) | ☐ review: 6 confirmed + 5 plausible findings → group 1b |
| 1b Review fixes (146) | A1, A2, A3, A30 (data) again + one clone case per finding | 2026-10-25 | fresh clones: A1, A2 (redone with a pre-146-safe snapshot), A3, 30 constraint cases (+ export scope ANY), 7 finding cases, 2 NOTICEs; `eatfit` converged to the fresh-clone rules; 12 calculate-tax cases byte-identical; tax 91/91 | baseline green (member 324, franchise 36, reports 20, platform 36, lint, build); group 0 links 37/37 | ✅ |
| 2 Shared library | util specs (incl. A6 / A7 / A31 cases) | 2026-10-25 | 68 util specs; mutation (applies-to first) caught; admin + web build | baseline green (tax 91, member 324, franchise 36, reports 20, platform 104, lint, build) | ☐ review: 3 confirmed + 5 plausible → group 2b |
| 2b Matcher review fixes | the same + D4 order pinned + fail-closed facts | 2026-10-25 | 88 util specs; mutations date-first (9 failed) and applies-to-first (11 failed) caught; 146 State form on a clone | baseline green (platform 124); admin + web build; group 1 live: 12 calculate-tax cases identical, A3 identical; 146 re-run on `eatfit` no-op | ✅ |
| 3 RBAC (147) | A23a | 2026-10-25 | 147 on a clone (twice); A23a live 20/20; Tax Master screen loads for super admin; tax 96 | baseline green (member 329, platform 124); admin + web build; group 1 live unchanged | ☐ review: 3 confirmed (mapped super admins locked to EFMUM, unmapped admin global, re-grant on re-run) → group 3b |
| 3b RBAC review fixes | A23a + mapped super admin / unmapped admin | 2026-10-25 | jest: scope (mapped super admin all, unmapped none), resolution `allFranchises`; 147 first-run guard on a clone; live A23a 20/20 with the QA super admin mapped to EFMUM, sees all 3 franchises | baseline green (tax 97, member 330, franchise 36, reports 20, platform 124, core auth 53, lint, build); admin + web build; group 1 live: 12 calculate-tax identical, A3 identical | ✅ |
| 4 Registrations + currency | A23b, A30 (issue) | | | | ☐ |
| 5 Resolver / guardrails / preview | A7, A8 (API), A12a, A22 (rules), A23c, A31 | | | | ☐ |
| 6 Engine refactor | **A4**, A5, A6, A9, A10, A11, A12b, A22 (tax), A25 | | | | ☐ |
| 7 Config retirement (148) | A24, A27 | | | | ☐ |
| 8 Email templates + welcome (149) | A26, A32, A23e | | | | ☐ |
| 9 Customer registration | A16, A17 (API), A28 | | | | ☐ |
| 10 Evidence (admin) | A18 (API), A23d, A29 (API) | | | | ☐ |
| 11 Counters + foreign-registration invoicing (150) | A13, A14, A15, A33, A34, A35 | | | | ☐ |
| 12 Export documents | A21 (API) | | | | ☐ |
| 13 Admin Tax Master / registrations / currency UI | A5 / A7 / A8 / A22 / A30 / A33 (browser) | | | | ☐ |
| 14 Admin payment and order UI | A17 / A18 / A21 / A29 (browser) | | | | ☐ |
| 15 Close-out | all; diagram refreshed | | | | ☐ |

## Automated Checks

- [ ] `cd shared-library && npm run build` (the util specs live in `server_1/libs/platform`)
- [ ] From `server_1`, one config per project: `npx jest --config libs/modules/member/jest.config.ts`, then the same for `libs/modules/franchise`, `libs/admin-only/reports`, `libs/platform` and (from group 8) `libs/modules/notification`. The tax subset is `npx jest --config libs/modules/member/jest.config.ts libs/modules/member/src/tax`.
- [ ] From `server_1`: `npm run lint` and `npm run build`
- [ ] From `eatfit247-admin`: `npx ng build --configuration development` and `npx eslint <changed files>`
- [ ] From `eatfit247-web-1`: `npx nx build` (SSR); no website changes, but the shared contract changes
- [ ] Migrations 146–150 on a fresh DB after 145 and on a production-like clone: clean, re-run clean, duplicate abort (A1–A3)

## Manual Checks

- [ ] API: curl registrations CRUD, rule save with warnings, preview, `calculate-tax` / `preview-update` evidence and the decision, export documents (happy path + one failure each)
- [ ] UI (admin, Chrome): Tax Master When/Then form, list, preview; franchise Tax registrations tab, currency and counters; evidence on payment create and edit; product export documents; Email Templates switches
- [ ] PDF: A13 foreign-registration invoice (AED), A14 credit note, A16 India B2B invoice, UAE B2B invoice with the buyer TRN, A27 pre-144 SAC
- [ ] Owner walk-through: each seeded rule in the preview against mapping-table rows 1–15 before release
- [ ] RBAC (A23) with `qa.franchise.admin`, `qa.nutritionist.f2`, `qa.social` and the super admin

## Review

- [x] Spec review round 1 by three Fable agents against the code and the local DB (2026-10-25). Findings folded in: the dimension-order precedence, country-aware backfill, retirement by module, registration counters, Tax Master scoping, evidence via preview, real commands.
- [x] Spec review round 2 by two Fable agents (2026-10-25). Findings folded in:
  - conditions before "specific plan", so the s.24(i) refusal isn't bypassed; the row 7 seed for any registration
  - a later `effective_from` supersedes; `fallback_only`; scope-compatible fallbacks
  - evidence through `calculate-tax` on create; the 409 code carried in the message
  - service-side RBAC (the guard has no conditions); franchise_admin edit grants; explicit `TaxEvidence` grant
  - FBIL never used for a foreign registration (priced in its currency); series `DOMESTIC` in the registration counter; constraint drops; prefix trigger; Table 13 filter
  - per-project jest configs; util specs in `server_1/libs/platform`; the date-bomb credit-note test fixed in group 0
  - the welcome mail has no sender
- [x] Legal validation of every decision (2026-10-25): requirements § Legal Validation (IGST s.7, 10, 12, 13, 14, 16; CGST s.22, 24, 25, 34, 35, Rules 46, 53, 96, 96A; Circulars 202/14/2023, 242/36/2024; UAE Decree-Law Art 31, 69; ER Art 23, 30, 31, 41, 59, 60; FTA VATP040 and E-Commerce Guide)
- [ ] Diff reviewed at the requirements level: does the code do what `requirements.md` says?
- [ ] Deep review by subagents per group (tax correctness and invariants, rule precedence and overlap, invoice series and gaps, franchise leakage, conventions). Findings fixed or logged as new plan groups
- [ ] Specs and code are in sync. Every fix made during review is reflected back into `requirements.md` / `plan.md`
- [ ] I can explain the change (read the key tests, run them under the debugger if needed)
