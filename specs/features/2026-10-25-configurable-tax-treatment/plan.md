# Plan: Configurable Tax Treatment

> Source: [requirements.md](./requirements.md) · Done when: [validation.md](./validation.md) passes
>
> Decision numbers (D#) refer to requirements.md. Scorecard rows (A#) refer to validation.md.

## How this plan is built: one group at a time, hill climbing

Owner rule (2026-10-25): development goes **one group at a time**, and every group is validated before the next starts. Each group must leave the system **at least as good as before**: never a regression, only new passing checks.

For every group:

1. **Build** only that group's tasks.
2. **Gate: new checks.** The group's own checks (listed under "Gate") pass: unit tests, the scorecard rows it owns, and a live check against the local servers (admin :4200, admin-api :3001, public-api :3000; member 4945 or a QA dummy member).
3. **Gate: no regression.** Re-run every earlier group's gate plus the **baseline** below. Everything must be green, with nothing skipped and no expected tax output edited.
4. **Review** the group's diff against requirements: subagent review for tax, invoice, migration and RBAC groups. Findings become a new group here, not silent patches.
5. **Record** an "As built" note under the group and a row in validation.md § Gate log (date, checks run, result; failed runs too).
6. **Commit** that group's paths only (explicit pathspecs), then start the next group.

A later group never starts on a red gate. If a gate can't pass as specified, replan in this file first.

**Baseline** (run from `server_1` unless noted, at every gate). There is no root jest config, so each project's config is passed:
- `npx jest --config libs/modules/member/jest.config.ts libs/modules/member/src/tax`: the matrix rows 1–14 with **expected tax outputs unedited** (A4); 89/89 after group 0
- `npx jest --config libs/modules/member/jest.config.ts`, and the same for `libs/modules/franchise`, `libs/admin-only/reports`, `libs/platform` (and `libs/modules/notification` from group 8, once 8.0 adds its config)
- `npm run lint` and `npm run build` (shared library + `admin-api` + `public-api`)
- from group 1 on: the A3 hash check of issued invoices and the counters check
- for groups that touch the admin: `cd eatfit247-admin && npx ng build --configuration development` and `npx eslint <changed files>`

## Group 0: Docs and a green baseline

- [ ] 0.1 Roadmap: add **4.14 Configurable tax treatment** (🚧, link); notes on 4.10 (G15), 7.4 (export documents) and 8.x (G7 admin side; online deferred).
- [ ] 0.2 Matrix spec: G7, G9 and G15 handled here; row 14 configurable; matrix decisions 8 and 10 superseded by D15; remove the old release step "clear MEMUM's GSTIN".
- [ ] 0.3 Record for replanning:
  - the principle 1 wording
  - the markets table (treatment is configuration; admin-entered payments; franchise currency)
  - the tech-stack convention "no feature switch in `mst_configs` (`DIET_SAC_CODE` excepted)"
- [ ] 0.4 Fix the date bomb in `credit-note.service.spec.ts` (A19 case of the tax-engine feature): pin the clock with jest fake timers. Test-only change.
- **Gate:** baseline fully green (tax suite 89/89); links resolve.

## Group 1: Database (migration 146)

- [ ] 1.0 Local DB only, through the franchise form: clear the copied GSTIN on HCUAE and MEMUM; enter a test TRN on HCUAE. Baseline stays green.
- [ ] 1.1 `mst_franchise_tax_registrations` (D8): franchise, country `varchar(3)`, tax system, number, State, IEC, `currency_code`, effective dates, active, prefix, format, FY start, audit columns; partial unique index on (country, tax system, upper(number)) WHERE active.
- [ ] 1.2 `mst_franchises.currency_code` (D17), backfilled from the address country's `mst_countries.currency_code`.
- [ ] 1.3 Registrations backfill from `txn_addresses` (`table_id = 4`):
  - GST only in IN; VAT in the address country
  - currency from the country
  - a GSTIN on a non-Indian franchise → NOTICE, skipped
  - **abort** on a GSTIN shared by two Indian franchises
  - re-run is a no-op
- [ ] 1.4 `mst_tax_master`:
  - add `customer_scope`, **`place_of_supply_country_code`**, `state_relation`, `registration_condition`, `customer_type_condition`, `electronic_condition`, `money_condition`, `applies_to`, `treatment`, `refusal_message`, `invoice_note`, `requires_evidence`, `fallback_tax_master_id` and `fallback_only`, with check constraints
  - `DROP CONSTRAINT uq_tax_master`; a unique index (COALESCE) over the D4 dimensions + `effective_from` WHERE `fallback_only = false`
  - existing reference-1 service rows → ALL; product rows → SPECIFIC; all → SAME_COUNTRY / CHARGE
- [ ] 1.5 Seeds (D5), `WHERE NOT EXISTS`, with legal references:
  - **EFMUM services, any foreign:**
    - money FOREIGN → `EXPORT_LUT_OR_TAX`
    - money DOMESTIC → `CHARGE`
  - **MEMUM goods:**
    - same country + State OTHER + UNREGISTERED → `REFUSE` (s.24(i))
    - any foreign + registration ANY → `EXPORT_LUT_OR_TAX` (the D6 invariant refuses when unregistered)
  - **HCUAE:**
    - any foreign services → `ZERO_RATED_EXPORT` (Art 31 note, `requires_evidence`), with the `fallback_only` rule "any foreign services → `CHARGE` 5% STANDARD"
    - any foreign goods → `ZERO_RATED_EXPORT` (Art 30 note)
- [ ] 1.6 Sale columns (D13):
  - `tax_master_id` on payments and order items
  - `tax_registration_id` on payments, `txn_member_products`, order items and `txn_credit_notes`
  - the evidence jsonb on payments and order headers
  - `customer_type`, `customer_registration_country` and `payer_account_country`
  - export-document columns on `txn_member_products`
- **Gate:** A1, A2 (clone), A3, A30 (data); apply to `eatfit`; a live admin payment is priced as before; baseline green.

## Group 2: Shared library

- [ ] 2.1 Enums: treatment, customer scope, State relation, registration / customer-type / electronic / money conditions, applies-to, evidence status, evidence decision, export document type.
- [ ] 2.2 Interfaces: rules, registrations (with currency), `ITaxEvidence` / `IEvidenceDecision`, preview, save warnings, `IInvoiceRegistration`, email-template switch; franchise `currencyCode`; D13 fields on payment, order and credit note.
- [ ] 2.3 `TaxRuleMatchUtil`: match (billing for services, delivery for goods, GSTIN State for India B2B services), D4 precedence, duplicate detection.
- [ ] 2.4 `TaxRegistrationNumberUtil` (GSTIN mod-36 check digit and State; TRN 15 digits) and a dial-code → ISO helper.
- [ ] 2.5 Specs in `server_1/libs/platform`.
- **Gate:**
  - specs for every seeded rule
  - the row 4 case (REFUSE beats the product rate row)
  - `{country=SA}` vs `{any foreign, money}`; `{any foreign, electronic}` vs `{country=SA}`
  - same-date duplicate refused vs a later date superseding
  - `fallback_only` never matched
  - GSTIN / TRN samples incl. `456789`; dial codes `+971` / `971` / `India` / `+1`
  - `npm run build`; server and admin compile; baseline green

## Group 3: RBAC (migration 147)

- [ ] 3.1 `147_tax_rbac.sql` (idempotent, following migrations 140–142):
  - `TaxMaster.franchise_scoped = true`
  - `franchise_admin` Create / Update on `TaxMaster`
  - subjects `TaxEvidence` (franchise-scoped) and `EmailTemplate` (global) `ON CONFLICT (subject_code) DO NOTHING`; super admin auto-granted by trigger
  - `financial_manager` Read / Update on `TaxEvidence`, granted explicitly
- [ ] 3.2 Service-side scoping for Tax Master: controllers pass `IAuthUser`; list and details filter `franchiseId IN user.franchiseIds`; writes to another franchise → 403 (pattern: `lut.service.ts:162`). The engine lookup is unaffected. Add both subjects to `AdminSubjectEnum`.
- **Gate:** A23a with super admin, `qa.franchise.admin` (own only), `qa.nutritionist.f2` and `qa.social`; the Tax Master screen still works for super admin; baseline green.

## Group 4: Backend: tax registrations and franchise currency

- [ ] 4.1 `TaxRegistrationService`:
  - `findActive`, `home`
  - CRUD under `TaxMaster`, scoped as in 3.2
  - overlapping dates refused per country and tax system
  - old columns synced
- [ ] 4.2 Move every reader to the service:
  - engine checks
  - `tax-master.service.ts:61-69`
  - franchise service and details
  - turnover service and cron
  - documents issued (`reportable`)
  - model scopes `txn-member-payment.model.ts:231-233` and `txn-member-product.model.ts:165-167`
  - mapper callers `member-plan.service.ts:1344` and `member-product.service.ts:658`, which pass `IInvoiceRegistration`
  - admin `invoice-numbering.component.ts:126` and `turnover-badge.component.ts:50`
  - Leave `mst_referrers.gst_number` and the shipment include alone.
- [ ] 4.3 `applyFx` takes the functional currency from `franchise.currency_code` (D17); the franchise DTOs accept it.
- **Gate:**
  - unit tests
  - curl CRUD
  - A23b
  - an existing PDF prints the same supplier GSTIN; a HCUAE PDF prints the test TRN
  - an EFMUM invoice still records INR
  - A30 (issue)
  - baseline green

## Group 5: Backend: rule resolver, guardrails, preview (tax)

- [ ] 5.1 `TaxMasterService.resolve(facts)` with `TaxRuleMatchUtil`; no match → today's 400.
- [ ] 5.2 Save-time validation: every D7 block and warning; warnings require `legal_basis`.
- [ ] 5.3 `POST tax-master/preview` (`TaxMaster` Read, scoped): the winning rule, the runners-up and any shadowing warning. The computed tax is added in group 6.
- **Gate:** unit tests; A7, A8, A12a, A22 (rules) and A31 by curl; A23c; pricing unchanged; baseline green.

## Group 6: Backend: engine refactor (tax core)

- [ ] 6.1 `calculate`: the D6 invariants first (today's order), then facts on the place of supply (billing / delivery), resolve, execute; no country literals in the decision flow.
- [ ] 6.2 Executors:
  - `CHARGE`
  - `ZERO_RATED_EXPORT`
  - `EXPORT_LUT_OR_TAX`: refused without a GST registration, with today's message
  - `OUT_OF_SCOPE`
  - `REFUSE`
  - `FOREIGN_REGISTRATION`: refused until group 11
  - same `TaxMode` values; inclusive back-out at the rule rate; return the rule ID and registration ID
- [ ] 6.3 Default goods rule (`applies_to = ALL`).
- [ ] 6.4 Store the D13 fields in the admin and public flows (public evidence = `NOT_COLLECTED`).
- [ ] 6.5 The preview returns the computed tax.
- [ ] 6.6 Rewire the matrix harness to the seeded rules; row 4 becomes rule-based; row 12 unchanged; **expected tax outputs unchanged**.
- **Gate:**
  - **A4**, A5, A6, A9, A10, A11, A12b, A22 (tax), A25
  - live through the admin: a domestic EFMUM payment, an EFMUM export with the test LUT, a HCUAE UAE payment, and the A5 switch via the preview plus a payment
  - baseline green

## Group 7: Config retirement (migration 148)

- [ ] 7.1 Code first: remove the readers and `ConfigParam` entries:
  - `tax-engine.service.ts:211` (`ALLOW_UNREGISTERED_INTERSTATE_GOODS`)
  - `member-plan.service.ts:121` (`GST_ENABLED` → `taxApplicable` = the member's franchise has an active registration)
  - `franchise.service.ts:429` and the franchise form's international-tax-mode block (`manage-franchise.component.ts:129, 200-206`; `api.service.ts:21`)
  - the `TAX_PERCENTAGE`, `SEND_WELCOME_MAIL` and `SEND_DIET_MAIL` enum entries
  - **`DIET_SAC_CODE` and its reader (`member-plan.service.ts:1885`) stay.**
- [ ] 7.2 `148_retire_config_switches.sql`: `module = 'Retired'` for the five rows; idempotent; applied with or after the 7.1 deploy.
- **Gate:** A24, A27; the APIs restart and boot without the retired rows; the franchise form loads and saves; baseline green.

## Group 8: Email template switches and the welcome email (migration 149)

- [ ] 8.0 Add a jest config and `test` target to `libs/modules/notification` (pattern: `libs/modules/pocket-guide/jest.config.ts`); it has none today.
- [ ] 8.1 `149_email_template_switches.sql`: `member_welcome.active = false` (idempotent; never deleted).
- [ ] 8.2 Admin API `email-template` (`EmailTemplate` Read / Update): list templates with `active`, `send_email_notification` and `send_whatsapp_notification`; `PATCH` a switch. No content editing.
- [ ] 8.3 Emit `member.created` from admin member create (`member.service.ts:157`) and public signup. The notification listener handles it with `getNotificationTemplate('member_welcome')` (active only) and the send flags, idempotent per member.
- [ ] 8.4 Review and complete `templates/member/welcome.ejs` and `templates/whatsapp/member/welcome.txt` (variables `memberName`, `franchise`; the login link only when a URL is configured).
- [ ] 8.5 Admin **Email Templates** screen: list with three slide toggles (standalone + `inject()`, Material, tokens), visible with `EmailTemplate` Read.
- **Gate:**
  - A26 (diet plan honours its switch)
  - A32 (welcome: inactive → no mail; activated in the admin → one mail on the next member create; a duplicate event sends no second mail)
  - A23e (`EmailTemplate`: only super admin)
  - baseline plus the notification specs green

## Group 9: Backend: customer registration (G15)

- [ ] 9.1 Validate the customer GSTIN / TRN on admin payment and order create (`member-plan.dto.ts:75`, `member-product.dto.ts:68`), and on payment update only when changed. Refuse a GSTIN on a non-Indian billing address. Set `customer_type` and the registration country.
- [ ] 9.2 India B2B services: the place-of-supply State = the GSTIN State (stored and printed); a mismatch is noted in the reason.
- [ ] 9.3 The mapper prints the buyer TRN on a UAE B2B tax invoice.
- [ ] 9.4 `customer_type` feeds the facts.
- **Gate:** A16, A17 (API), A28; the B2B PDFs read; baseline plus groups 1–8 green.

## Group 10: Backend: evidence on admin entry (G7)

- [ ] 10.1 Requests carry the declaration and `payer_account_country`; billing country and normalised dial code come from the member; the check runs when the rule has `requires_evidence`; the result is stored.
- [ ] 10.2 Evidence returned by `calculate-tax` on create (`member-plan.controller.ts:124`, `member-product.controller.ts:66`) and by `preview-update` on payment edit (`:86`).
- [ ] 10.3 A save with a mismatch and no decision → 409, message starting `TAX_EVIDENCE_DECISION_REQUIRED`. A decision needs `TaxEvidence` Update and is stored with user and time.
- [ ] 10.4 Indian franchise: a DOMESTIC route with a foreign payer account → a warning; the route decides the tax.
- [ ] 10.5 List filter and report for `MISMATCH` records and their decisions.
- **Gate:** A18, A29, A23d; baseline plus groups 1–9 green.

## Group 11: Backend: invoice counters and foreign-registration invoicing (migration 150)

- [ ] 11.1 `150_registration_invoice_series.sql`:
  - `mst_invoice_sequences.tax_registration_id`
  - `DROP CONSTRAINT uq_mst_invoice_sequences_franchise_type_year_series`, then a unique index over (franchise, type, FY, series, `COALESCE(tax_registration_id, 0)`)
  - registration prefix CHECK `^[A-Z0-9]{1,5}$`, a unique index, and a trigger against franchise prefixes
  - **insert the missing counter rows (current number 0) for every active franchise × business type × series it can use in its current FY, plus its credit-note counter** (D12); existing counters untouched
  - the `admin_invoice_counter_reminder` row in `mst_email_templates`
- [ ] 11.2 `invoice-sequence.service.ts`: **`findOrCreate` becomes a locked `findOne`** keyed with `taxRegistrationId` (NULL for home / unregistered); a missing counter throws the 409 `INVOICE_COUNTER_MISSING` naming franchise, type, FY, series and registration (D12). Update the model's index block. Check that every caller (`member-plan.service.ts:454`, `:676`, `member-product.service.ts:1160`, `payment-confirmation.service.ts:158`, `credit-note.service.ts:93`) issues inside the save's transaction, so the entry rolls back. `calculate-tax` / `preview-update` return `counterMissing`.
- [ ] 11.3 Foreign-registration issue:
  - series `DOMESTIC` in the registration's counter, prefix, format and FY start
  - the Rule 46 check by registration country (`invoice-issue.service.ts:80`)
  - priced from the plan's fee in the registration currency
  - book equivalent via `applyFx` in the franchise currency
- [ ] 11.4 Document, PDF and credit notes from `IInvoiceRegistration`; credit notes use a registration-scoped `C` counter.
- [ ] 11.5 Documents issued: filter by `tax_registration_id`; per-registration listing.
- [ ] 11.6 Admin counters endpoints (D14 rights, scoped in the service): list every franchise's (and registration's) counters, including unused ones; create one (start 0, or a starting number only when no invoice exists in that key); "create next FY counters". No update or delete.
- [ ] 11.7 Enable the `FOREIGN_REGISTRATION` executor; registration save validates its format and prefix.
- [ ] 11.8 Year-start reminder cron (pattern: `franchise-turnover.cron.ts`, advisory lock): 30 days before a franchise's FY start, email super admins once when a counter used this FY has no next-FY row.
- **Gate:**
  - A13, A14, A15, A33, A34, A35 with a test UAE registration (AED) on EFMUM and an AED fee on a test plan (PDF and credit note read)
  - A34 live: rename a test franchise's next counter key in a transaction-scoped test (or use a test franchise with no counter), enter a PAID payment → 409, no payment row, counters unchanged
  - A3: existing EFMUM counters unchanged
  - baseline plus groups 1–10 green

## Group 12: Backend: goods-export documents (G9)

- [ ] 12.1 `PUT member/:id/product/:productId/export-documents` (`MemberProducts` Update, scoped), only for orders with `invoice_series = EXPORT`; validates the type, number, date and port code.
- [ ] 12.2 Flag export orders without documents 30 days after their first `IN_TRANSIT` event.
- **Gate:** A21 (API) in jest plus SQL on a seeded test order. Don't create PAID product orders locally (courier account 1 is the live NimbusPost account). Baseline plus groups 1–11 green.

## Group 13: Admin: Tax Master, registrations and franchise currency UI

- [ ] 13.1 Tax Master form: **When** (conditions, with "billing address for services / delivery address for goods" shown) and **Then** (treatment, rate, category, HSN/SAC, note, refusal message, evidence and fallback, `fallback_only`), plus dates and the legal basis. Fields show or hide by treatment; warnings appear inline.
- [ ] 13.2 List with a franchise filter, condition summary and treatment; preview panel.
- [ ] 13.3 Franchise **Tax registrations** tab (pattern: `lut-register`), with currency; `invoice-numbering.component` gains a registration mode, lists every counter and creates counters (single and "next FY"); the payment and order forms show `INVOICE_COUNTER_MISSING` from the preview.
- [ ] 13.4 Franchise form: `currency_code`.
- [ ] 13.5 Standalone + `inject()`, Material, `var(--md-sys-*)`, `.html` / `.scss` per component.
- **Gate:**
  - Chrome walk-through: the seeded rules; the preview reproduces mapping-table rows 1–13; the A5 switch from the UI; A7 / A8 messages; registrations CRUD; currency saves; counters listed and created; the missing-counter message on a payment form
  - `qa.franchise.admin` sees and edits only their own
  - baseline plus groups 1–12 green

## Group 14: Admin: payment and order entry

- [ ] 14.1 Create forms:
  - customer GSTIN / TRN with live validation and a B2B chip
  - declaration and payer account country when `calculate-tax` says evidence is required
  - evidence result and DOMESTIC-route warning inline
- [ ] 14.2 Payment edit: the update-preview dialog shows the evidence; a mismatch requires the decision from `TaxEvidence` holders; others see "waiting for finance".
- [ ] 14.3 Mismatch filter on the lists; decision shown on details.
- [ ] 14.4 Product order details: export-documents form and the missing-documents flag.
- **Gate:** A17 (form), A18, A21 and A29 in the browser end to end with the PDFs read; baseline plus groups 1–13 green.

## Group 15: Close-out

- [ ] 15.1 All checks in `validation.md` pass (final full run of every gate).
- [ ] 15.2 Release runbook:
  - migrations 146–150 in order, each on a production clone first; 148 only with or after the group 7 deploy
  - enter HCUAE's real TRN
  - confirm each franchise's currency
  - review the seeded rules with the owner in the preview
  - the welcome email stays inactive until the owner activates it
- [ ] 15.3 Refresh the [Tax & Invoice Series Matrix](https://claude.ai/artifact/Mg89mVds7Dyjx1hvwd8N8v) diagram and metrics with the as-built values (rules, counters, test counts, scorecard).
- [ ] 15.4 `requirements.md` status → Shipped; roadmap 4.14 → ✅; the deferred online items stay listed.
- [ ] 15.5 Constitution changes for replanning (group 0.3).
