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

- [x] 0.1 Roadmap: add **4.14 Configurable tax treatment** (🚧, link); notes on 4.10 (G15), 7.4 (export documents) and 8.x (G7 admin side; online deferred).
- [x] 0.2 Matrix spec: G7, G9 and G15 handled here; row 14 configurable; matrix decision 8 superseded by D15 and decision 10 by D3 (the electronic condition); remove the old release step "clear MEMUM's GSTIN".
- [x] 0.3 Record for replanning:
  - the principle 1 wording
  - the markets table (treatment is configuration; admin-entered payments; franchise currency)
  - the tech-stack convention "no feature switch in `mst_configs` (`DIET_SAC_CODE` excepted)"
- [x] 0.4 Fix the date bomb in `credit-note.service.spec.ts` (A19 case of the tax-engine feature): pin the clock with jest fake timers. Test-only change.
- [x] 0.5 *(replan 2026-10-25, found at the first gate run)* `libs/platform` jest: `google.service.spec` fails to load (`InputLengthEnum` undefined) because it mocks `@eatfit247-shared-lib` with `ConfigParam` only, while the real `@server_1/core` it loads needs the rest. Spread `jest.requireActual` into the mock. Test-only change; known red since 4.5 (checkout-lockdown plan, compliant-invoice-numbering validation).
- [x] 0.6 *(replan 2026-10-25)* `npm run lint` errors on every file of both apps with "Definition for rule '@typescript-eslint/no-extra-semi' was not found": the rule left typescript-eslint in v8 (installed 8.51). Remove it from the root `.eslintrc.json` (both overrides). Tooling-only change; warnings stay as they are.
- [x] 0.7 *(replan 2026-10-25, owner chose the code fix)* With 0.5 the suite loads and 2 of its cases fail: `getGoogleBusinessReviews` makes a stray `await this.getPlaceId('EatFit247')` (`google.service.ts:600`, from `228f4557`) whose result is discarded, so every reviews fetch makes an extra Places call and fails when that lookup fails. Remove the call; the tests stay as written. Small production change to the public success-stories reviews endpoint.
- **Gate:** baseline fully green (tax suite 89/89); links resolve.

> **As built (group 0, 2026-10-25):**
> - Roadmap: 4.14 added (🚧, spec link); notes on 4.10 (G15), 7.4 (export documents, G9) and 8.0 (G7 admin side; website side deferred). "Last updated" moved to 2026-10-25.
> - Matrix spec: G7 / G9 / G15 point here; row 14 is configurable; decision 8 struck through and superseded by D15 (MEMUM's REFUSE rule), decision 10 by D3 (the electronic condition), not D15 as 0.2 first said; decision 13's GSTIN-clearing note and plan 12.4 / validation's "clear MEMUM's GSTIN" release step removed (production is clean; the local DB is step 1.0). Not edited, since 0.2 covers the matrix spec only: the same stale step in the 4.6 plan (release runbook, franchise data) and validation (owner item 2), and compliant-invoice-numbering's replanning note 5.
> - 0.3: § Replanning notes below (principle 1, markets table, the `mst_configs` convention, plus the stale "currently at 135" migration count in tech-stack.md).
> - 0.4: `credit-note.service.spec.ts` pins the clock with `jest.useFakeTimers({ now: 2026-10-12T08:00Z })` (7 days after the default event date, inside the 14-day deadline; microtasks and `setImmediate` stay real) and restores real timers after each test. It failed from 2026-10-20 on (`lateIssue` true).
> - 0.5 / 0.7: the platform suite now loads and is green (36/36; it was 26 tests with one suite failing to load). 0.7 removed the stray `getPlaceId` call, a production change to `GET` Google reviews (public success stories) that saves one Places API call per fetch.
> - 0.6: `npm run lint` runs clean (0 errors; the 9 existing warnings stay). Lint still covers only the two app projects, because the root `ignorePatterns` skip `libs/`.
> - Gate run: tax 89/89; member 322/322; franchise 36/36; reports 20/20; platform 36/36; shared-library build, `npm run lint` and `npm run build` (admin-api + public-api) green; 37 relative links in the touched specs resolve. Review: docs and test-only changes except 0.7, so no subagent review (the plan requires one only for tax, invoice, migration and RBAC groups).

## Group 1: Database (migration 146)

- [x] 1.0 Local DB only, through the franchise form: clear the copied GSTIN on HCUAE and MEMUM; enter a test TRN on HCUAE. Baseline stays green.
- [x] 1.1 `mst_franchise_tax_registrations` (D8): franchise, country `varchar(3)`, tax system, number, State, IEC, `currency_code`, effective dates, active, prefix, format, FY start, audit columns; partial unique index on (country, tax system, upper(number)) WHERE active.
- [x] 1.2 `mst_franchises.currency_code` (D17), backfilled from the address country's `mst_countries.currency_code`.
- [x] 1.3 Registrations backfill from `txn_addresses` (`table_id = 4`):
  - GST only in IN; VAT in the address country
  - currency from the country
  - a GSTIN on a non-Indian franchise → NOTICE, skipped
  - **abort** on a GSTIN shared by two Indian franchises
  - re-run is a no-op
- [x] 1.4 `mst_tax_master`:
  - add `customer_scope`, **`place_of_supply_country_code`**, `state_relation`, `registration_condition`, `customer_type_condition`, `electronic_condition`, `money_condition`, `applies_to`, `treatment`, `refusal_message`, `invoice_note`, `requires_evidence`, `fallback_tax_master_id` and `fallback_only`, with check constraints
  - `DROP CONSTRAINT uq_tax_master`; a unique index (COALESCE) over the D4 dimensions + `effective_from` WHERE `fallback_only = false` **and `active`** (D4 refuses two *active* equal rules; a deactivated rule must not block its re-entry). The key also holds franchise, supplier country and transaction type, and the reference only when `applies_to = SPECIFIC`
  - existing reference-1 service rows → ALL; product rows → SPECIFIC; all → SAME_COUNTRY / CHARGE
  - *(replan 2026-10-25)* column defaults are the legacy shape (SAME_COUNTRY, every condition ANY, `applies_to` SPECIFIC, CHARGE, not fallback-only), so a row saved by today's Tax Master form keeps today's meaning until group 5 replaces the save; a new ALL rule stores `reference_id = 0` (ignored), while the legacy reference-1 service rows keep 1 for today's lookup
- [x] 1.5 Seeds (D5), `WHERE NOT EXISTS`, with legal references:
  - **EFMUM services, any foreign:**
    - money FOREIGN → `EXPORT_LUT_OR_TAX`
    - money DOMESTIC → `CHARGE`
  - **MEMUM goods:**
    - same country + State OTHER + UNREGISTERED → `REFUSE` (s.24(i))
    - any foreign + registration ANY → `EXPORT_LUT_OR_TAX` (the D6 invariant refuses when unregistered)
  - **HCUAE:**
    - any foreign services → `ZERO_RATED_EXPORT` (Art 31 note, `requires_evidence`), with the `fallback_only` rule "any foreign services → `CHARGE` 5% STANDARD"
    - any foreign goods → `ZERO_RATED_EXPORT` (Art 30 note)
  - *(replan 2026-10-25)* **rates come from today's rule.** Each seed copies the tax system, rate, inclusive flag, HSN/SAC and `effective_from` of the franchise's current same-country rule (EFMUM's and HCUAE's reference-1 service row; MEMUM's active row per product), because today's export and IGST branches price at that rule's rate. So MEMUM's export rule is seeded **per active product** (SPECIFIC), not as ALL; when the owner changes a product's rate, its export rule needs the same edit (the group 5 preview shows both). Fixed values: the HCUAE export rules are VAT 0% ZERO_RATED and the fallback VAT 5% STANDARD; the MEMUM refusal is NONE 0% with today's s.24(i) message. No source rule → that seed is skipped with a NOTICE
- [x] 1.6 Sale columns (D13):
  - `tax_master_id` on payments and order items
  - `tax_registration_id` on payments, `txn_member_products`, order items and `txn_credit_notes`
  - the evidence jsonb on payments and order headers
  - `customer_type`, `customer_registration_country` and `payer_account_country`
  - export-document columns on `txn_member_products`
- [x] 1.7 *(replan 2026-10-25)* **Keep today's engine on today's rows** until group 6. The seeds share franchise, reference, transaction type and supplier country with the existing rows, with an equal or newer `effective_from`, so today's newest-first lookup (`tax-master.service.ts` `findRule`) could pick them: MEMUM's per-product export rule has the same product reference and `effective_from` as its 12% rate row, a tie the lookup breaks arbitrarily (the ALL seeds store reference 0, which today's lookup never asks for, but a later ALL rule with reference 1 would be next). Code: `MstTaxMaster` gains the 1.4 columns (its index block follows 1.4); `findRule` matches only legacy-shaped rows (SAME_COUNTRY, every condition ANY, CHARGE, not fallback-only); the lookup spec asserts that filter. Group 6 replaces `findRule` with the resolver. Deploy order: 146 before this code.
- **Gate:** A1, A2 (clone), A3, A30 (data); apply to `eatfit`; a live admin payment is priced as before (calculate-tax for EFMUM domestic / foreign INR / foreign USD, HCUAE UAE and US clients, identical before and after 146 + 1.7); baseline green.

> **As built (group 1, 2026-10-25):**
> - **1.0** was done through `PUT franchise/manage/:id` (the franchise form's endpoint) as the QA super admin, sending every field back unchanged: HCUAE's GSTIN cleared and TRN `100123456700003` set; MEMUM's GSTIN cleared. Diffed against a pre-1.0 clone: only `gst_number`, `vat_number` and the audit columns changed, and the addresses are untouched.
> - **146** (`db_changes/146_configurable_tax_treatment.sql`), shaped like 144/145:
>   - The aborts run first, in a DO block, before any DDL (the whole file is one transaction).
>   - `mst_franchise_tax_registrations` has PK `tax_registration_id`.
>   - Rule columns are `varchar` + named CHECKs (house style, as `tax_category`). The enums arrive in group 2.
>   - The rule columns and the reference-1 → ALL mapping run only once (guarded by the `treatment` column).
>   - `ux_mst_tax_master_rule` replaces `uq_tax_master`.
>   - The sale columns use `tax_evidence` (jsonb); the export documents are `export_document_type` / `_number` / `_date` and `export_port_code`.
> - **1.7:** `LEGACY_RULE_SHAPE` in `tax-master.service.ts`; the model gains the 14 columns, and its `uq_tax_master` index block is removed. The tie it prevents was confirmed on `eatfit`: MEMUM product 1 has `GST_12` and `EXPORT_GOODS`, both from 2015-12-31.
> - **Review:** a subagent ran 146 on its own clones and found 6 confirmed and 5 plausible issues. They are fixed as group 1b, with every gate below re-run after the fixes.


## Group 1b: Review fixes for migration 146 (subagent review, 2026-10-25)

The group 1 review ran migration 146 on disposable clones and found these. Each is fixed in `146_configurable_tax_treatment.sql` or the 1.7 code, then group 1's gate is re-run.

- [x] 1b.1 **Every source version is seeded**, not only the newest (finding 1: a future-dated rate row became the only export rule, so earlier supply dates had none). One seed per active legacy rule version, with its `effective_from` **and `effective_to`**; the NOT EXISTS key includes `effective_from`.
- [x] 1b.2 **Plan-specific service rows get their twins** (finding 2: a plan's own rate and inclusive flag priced its foreign sales today). Each seed copies the source's `applies_to` and reference (0 for ALL).
- [x] 1b.3 **Seeds follow today's generic branches, not franchise codes**:
  - export / IGST twins for every Indian GST service rule
  - zero-rated export twins for every VAT service rule; the evidence policy and the 5% fallback only for UAE suppliers (Art 31, Art 3)
  - an export twin for every Indian GST product rule
  - the s.24(i) rule for every Indian franchise selling goods, as `REFUSE`, or as `CHARGE` NONE 0% when `ALLOW_UNREGISTERED_INTERSTATE_GOODS` is `true` (today's CA override, retired by group 7)
  - the goods-export rule for every VAT franchise
- [x] 1b.4 **Friendly aborts before any change** (findings 3 and 4):
  - two active legacy rules that collide on the new key (the old key allowed them when only `tax_code` differed) are listed
  - an active Indian franchise whose GSTIN, stripped of spaces and punctuation, is not the 15-character shape: today it charges GST, so dropping it would make it unregistered
  - the GSTIN is stored in that normalised form
  - an inactive franchise never blocks: its registration is back-filled inactive, and a malformed GSTIN is skipped with a NOTICE
  - duplicate VAT numbers are checked per address country among active franchises
- [x] 1b.5 **NOTICEs** (finding 5):
  - an active franchise left without foreign rules for a business type it runs
  - a VAT source rule that is inclusive at more than 0% (its exports back out at 0% under D6, not at the domestic rate as today)
- [x] 1b.6 **Today's Tax Master form keeps today's meaning** (finding 6): `create` / `update` store `applies_to = ALL` for a SERVICE rule with reference 1, else SPECIFIC. Spec case in `tax-master.service.spec.ts`.
- [x] 1b.7 **Export treatments need a foreign scope** (`ANY_FOREIGN` or `SPECIFIC_COUNTRY`): with scope ANY, an export rule could match a domestic sale. The CHECK is dropped and re-created, so a database that ran the first 146 converges. D7 is amended to match.
- Not fixed here: editing a seeded row through today's form can hit a CHECK and return 500 instead of 400. Group 5 replaces the save with validation.
- **Gate:** group 1's gate again, on fresh clones from the post-1.0 dump plus `eatfit` (re-running the fixed 146 must converge to the fresh-clone result), and a clone case per finding (future-dated row, plan-specific row, legacy duplicate, punctuated GSTIN, config true).

> **As built (group 1b, 2026-10-25):**
> - **146 now works from the generic sources:**
>   - Temp view `tmp146_franchise` holds the latest address country / currency and the normalised numbers.
>   - Temp view `tmp146_source` holds the active rule versions of today's shape.
>   - `pg_temp.rule_exists` suppresses a seed (conditions + `effective_from`, active or not).
> - **Seeds:**
>   - The UAE seeds keep "UAE VAT …" names; other VAT countries get a generic name and a "record the legal basis" note.
>   - The s.24(i) seed reads `ALLOW_UNREGISTERED_INTERSTATE_GOODS`.
>   - The goods-export rule of a VAT franchise starts at its earliest VAT rule.
> - **Code:** `legacyAppliesTo()` is used by `create` / `update`. `chk_mst_tax_master_export_scope` is dropped and re-created on every run.
> - **Clone cases, one per finding, all as specified:**
>   - legacy duplicate → abort "rules 1 (GST_18), 5 (GST_18_DUP) …"
>   - `BADGSTIN` on active MEMUM → abort; on inactive MEMUM → NOTICE, skipped
>   - `27-CSEPS 5397E1Z8` → registration `27CSEPS5397E1Z8`
>   - a future `GST_40` from 2027-04-01 → twins for both versions (18% from 2015, 40% from 2027)
>   - plan 7 at 5% inclusive → SPECIFIC twins at 5% inclusive
>   - CA override true → `NONE_S24_OVERRIDE` CHARGE
>   - the gap NOTICE (EFMUM given `product`) and the inclusive-VAT NOTICE both fire
> - **`eatfit`** had the first draft of 146. Re-running the fixed file there converged: its rules equal a fresh clone's (ignoring ids, timestamps and fallback ids, with fallback links compared by `tax_code`), and its registrations and constraints match.


## Group 2: Shared library

- [x] 2.1 Enums: treatment, customer scope, State relation, registration / customer-type / electronic / money conditions, applies-to, evidence status, evidence decision, export document type.
- [x] 2.2 Interfaces: rules, registrations (with currency), `ITaxEvidence` / `IEvidenceDecision`, preview, save warnings, `IInvoiceRegistration`, email-template switch; franchise `currencyCode`; D13 fields on payment, order and credit note.
- [x] 2.3 `TaxRuleMatchUtil`: match (billing for services, delivery for goods, GSTIN State for India B2B services), D4 precedence, duplicate detection.
- [x] 2.4 `TaxRegistrationNumberUtil` (GSTIN mod-36 check digit and State; TRN 15 digits) and a dial-code → ISO helper.
- [x] 2.5 Specs in `server_1/libs/platform`.
- **Gate:**
  - specs for every seeded rule
  - the row 4 case (REFUSE beats the product rate row)
  - `{country=SA}` vs `{any foreign, money}`; `{any foreign, electronic}` vs `{country=SA}`
  - same-date duplicate refused vs a later date superseding
  - `fallback_only` never matched
  - GSTIN / TRN samples incl. `456789`; dial codes `+971` / `971` / `India` / `+1`
  - `npm run build`; server and admin compile; baseline green

> **As built (group 2, 2026-10-25):**
> - **Enums** (`shared-library/src/enum/tax-rule.enum.ts`): treatment, customer scope, State relation, registration / customer-type / electronic / money conditions, `MoneyOriginEnum` (the sale's fact), applies-to, evidence status, evidence indicator result, evidence decision, export document type. Values = the 146 column values.
> - **Interfaces** (`src/core/tax/tax-rule.interface.ts`):
>   - rule conditions and treatment, `ITaxRuleMatchable`, facts, place of supply, resolution, save warning
>   - preview request / response, registrations (with currency), `IInvoiceRegistration`, `ITaxEvidence` / `IEvidenceDecision`
>   - `ITaxMaster` takes the conditions and treatment as optional fields until the admin form sends them (group 13)
>   - D13 fields on payments, order headers (plus the export documents), order items and credit notes; `taxMasterId`, `taxRegistrationId` and `taxEvidence` on `ICalculateTaxResponse`; `currencyCode` on the franchise
>   - `IEmailTemplateSwitch` / `IUpdateEmailTemplateSwitch`
> - **`TaxRuleMatchUtil`:** `placeOfSupply`, `moneyOrigin`, `matches`, `rank` / `compare` (D4), `resolve` (winner, runners-up, `ambiguous` on a full tie), `key` / `duplicates` (the `ux_mst_tax_master_rule` key), `shadowingWarnings`.
> - **`TaxRegistrationNumberUtil`** (GSTIN pattern, State set 01–38 / 97 / 99, GSTN mod-36 check character; TRN 15 digits; per-country check; labels) and **`DialCodeUtil`**.
> - **Specs** in `server_1/libs/platform/src/lib/utils/`. A first mutation check (applies-to moved to dimension 1) failed 4 tests.
> - **Builds:** admin dev and website SSR build against the new contract.
> - **Review:** a subagent found 3 confirmed issues (the specs didn't pin the D4 order; an unknown country counted as foreign; the GSTIN State `07` vs the master's `7`) and 5 plausible ones. Fixed as group 2b.


## Group 2b: Review fixes for the shared-library matcher (subagent review, 2026-10-25)

- [x] 2b.1 **The specs pin the whole D4 order** (finding 1: moving the date, or "applies to", earlier still passed every test). One case per adjacent pair of dimensions, where the loser is set on every later dimension and has the later date, plus "an ALL rule with a B2B / electronic / money condition beats a SPECIFIC rule".
- [x] 2b.2 **No place-of-supply country, no rule** (finding 2: an empty billing country counted as foreign and matched the export rule). This fails closed, like "an unknown State counts as another State".
- [x] 2b.3 **One GST State code form: the State master's, unpadded** (`7` for Delhi, as in `mst_states.code` and the stored place of supply) (finding 3). The GSTIN digits `07` become `7` in `checkGstin` and `placeOfSupply`. Migration 146 stores the registration State the same way, which changes nothing locally (EFMUM is 27).
- [x] 2b.4 **The GSTIN State applies only to a billing address in India** (finding 4). A legacy GSTIN on a foreign billing address no longer turns an export into a domestic sale.
- [x] 2b.5 The supply date is read as its day (finding 5).
- [x] 2b.6 **An unknown payment route is no money fact** (finding 6), so a money-conditioned rule can't match it; before, it counted as foreign money and leaned towards export.
- [x] 2b.7 **Dial codes with subscriber digits are read by longest prefix** (finding 7): `+9715` → AE, `+917` → IN, `+617` → AU. A city name stays NOT_AVAILABLE.
- [x] 2b.8 The spec's seeded ids match the local DB, plus a case where two rules differing only in their specific country are not duplicates.
- **Gate:** group 2's gate again, plus a mutation check: moving the date, and then "applies to", to dimension 1 must each fail the specs.

> **As built (group 2b, 2026-10-25):**
> - **State codes:** `gstStateCode()` gives the master's form, used by `checkGstin` and `placeOfSupply`. 146 stores `ltrim(left(gstin, 2), '0')` (clone: a Delhi GSTIN → `7`; `eatfit` unchanged, EFMUM is 27).
> - **Fail-closed facts:**
>   - `matches` returns false without a place-of-supply country
>   - the supply date is read as its day
>   - `moneyOrigin` accepts only `PaymentRouteEnum` values
>   - the GSTIN State applies only to an Indian billing address
> - **`DialCodeUtil`:** exact code first, then the longest code of up to 4 digits the number starts with.
> - **Specs:** fixture ids follow the DB (7 REFUSE, 8 MEMUM export, 9 fallback, 10 zero-rated services, 11 goods); the D4 order is pinned pair by pair (dimensions 1–7, each against all later dimensions plus a later date). Platform specs 88 (was 68).
> - **Mutation check:** date first → 9 failures; applies-to first → 11 failures.
> - **Group 1's live checks re-run on the new contract:** 12 `calculate-tax` cases identical, A3 identical.


## Group 3: RBAC (migration 147)

- [x] 3.1 `147_tax_rbac.sql` (idempotent, following migrations 140–142):
  - `TaxMaster.franchise_scoped = true`
  - `franchise_admin` Create / Update on `TaxMaster`
  - subjects `TaxEvidence` (franchise-scoped) and `EmailTemplate` (global) `ON CONFLICT (subject_code) DO NOTHING`; super admin auto-granted by trigger
  - `financial_manager` Read / Update on `TaxEvidence`, granted explicitly
- [x] 3.2 Service-side scoping for Tax Master: controllers pass `IAuthUser`; list and details filter `franchiseId IN user.franchiseIds`; writes to another franchise → 403 (pattern: `lut.service.ts:162`). The engine lookup is unaffected. Add both subjects to `AdminSubjectEnum`.
- **Gate:** A23a with super admin, `qa.franchise.admin` (own only), `qa.nutritionist.f2` and `qa.social`; the Tax Master screen still works for super admin; baseline green.

> **As built (group 3, 2026-10-25):**
> - **147** sets `TaxMaster.franchise_scoped` and adds `TaxEvidence` (scoped) and `EmailTemplate` (global). The trigger gave super admin all four actions on both. The explicit grants: franchise_admin TaxMaster create / update; financial_manager TaxEvidence read / update. Clone: a re-run changed nothing.
> - **`TaxMasterService`:** `findAll` / `fetchById` / `create` / `update` / `changeStatus` take the `IAuthUser`. Writes check both the rule's franchise and the one it would move to. `getApplicableTaxRule` (the engine) is unscoped. Controllers pass `@CurrentUser()`.
> - **A23a live** (QA super admin, `qa.franchise.admin` on 1, `qa.nutritionist.f2` on 2, `qa.social`): 20/20. The writes were no-op saves of the current values, and the rows were unchanged; the saves also confirmed 1b.6 live (rule 1 stays ALL).
> - **Browser:** the Tax Master list and edit screens load for super admin. The edit form can't show the buyer country or "applies to" of any rule: this is pre-existing and logged as 13.6.
> - **Review:** a subagent found 3 confirmed issues (super admins mapped to EFMUM were locked to EFMUM; an unmapped franchise admin would be global; a 147 re-run re-grants unticked permissions) plus 2 minor ones. Fixed as group 3b.


## Group 3b: Review fixes for RBAC (subagent review, 2026-10-25)

- [x] 3b.1 **Super admins see every franchise whatever their mapping; others fail closed** (findings 1 and 2; owner decision, D14 amended):
  - the problem: super admins 2, 4 and 5 are mapped to EFMUM, so "no mapping = unscoped" locked them to EFMUM's rules; and a franchise admin who lost their mapping would have become a global editor
  - `IAuthUser.allFranchises` / `ICachedPermissions.allFranchises` = the admin holds a role with `grant_all_on_new_subject`
  - Tax Master scopes on it; an unmapped non-super admin gets an empty list and 403 on writes
  - the RBAC cache key gains a version (`rbac:permissions:v2:`), so entries cached without the flag are never read
- [x] 3b.2 **147 grants only on its first run** (finding 3): the RBAC screen deletes unticked grants (`savePermissionMatrix` hard-deletes and re-inserts), so `ON CONFLICT DO NOTHING` would re-grant on a re-run. The marker is TaxMaster still not being franchise-scoped. The comment is corrected.
- Not fixed here (logged):
  - `franchise_admin` can edit admin users, including their own franchise mapping and roles, without scope (pre-existing; roadmap 4.4)
  - the franchise dropdown lists every franchise to a scoped admin (pre-existing, compliant-numbering replanning note 3)
  - today's Tax Master form can't show a rule's buyer country (`'AE '`, char(3)) or reference (`'1'`, bigint string): pre-existing, fixed with the form in group 13 (13.6)
- **Gate:** group 3's gate again, plus a super admin mapped to a franchise (sees all) and an unmapped non-super admin (sees none) in jest; live: a QA user mapped like admins 2 / 4 / 5 sees all 11 rules.

> **As built (group 3b, 2026-10-25):**
> - `ICachedPermissions.allFranchises` = `hasGrantAll` in `PermissionResolutionService`. `AdminUserService` sets `IAuthUser.allFranchises` (true only when the cached value is true). The cache prefix is now `rbac:permissions:v2:`.
> - `TaxMasterService` scopes on `allFranchises`: otherwise `franchiseId IN franchiseIds` (an empty list returns nothing), and writes get a 403.
> - 147's grants and the `franchise_scoped` update run in one DO block on the first run only. Clone: unticking (deleting) franchise_admin TaxMaster create, then re-running, keeps it off. Re-running on `eatfit` changed nothing.
> - **Specs:**
>   - tax master scope: a mapped super admin sees all, an unmapped admin sees none and gets 403s
>   - permission resolution: `allFranchises` true for a grant-all role mapped to franchise 1, false otherwise
>   - the cache spec now uses the v2 key
> - **Live:** `qa.super.admin` was temporarily mapped to EFMUM (like admins 2 / 4 / 5): A23a 20/20, and it sees franchises 1, 2 and 3. The mapping was restored afterwards and admin-api restarted.
> - **`LutService` and `CreditNoteService` keep "no mapping = unscoped"** (D14 note), for roadmap 4.4.


## Group 4: Backend: tax registrations and franchise currency

- [x] 4.1 `TaxRegistrationService`:
  - `findActive`, `home`
  - CRUD under `TaxMaster`, scoped as in 3.2
  - overlapping dates refused per country and tax system
  - old columns synced
- [x] 4.2 Move every reader to the service:
  - engine checks
  - `tax-master.service.ts:61-69`
  - franchise service and details
  - turnover service and cron
  - documents issued (`reportable`)
  - model scopes `txn-member-payment.model.ts:231-233` and `txn-member-product.model.ts:165-167`
  - mapper callers `member-plan.service.ts:1344` and `member-product.service.ts:658`, which pass `IInvoiceRegistration`
  - admin `invoice-numbering.component.ts:126` and `turnover-badge.component.ts:50`
  - Leave `mst_referrers.gst_number` and the shipment include alone.
- [x] 4.3 `applyFx` takes the functional currency from `franchise.currency_code` (D17); the franchise DTOs accept it.
- *(design, 2026-10-25, before coding)*:
  - **Placement:** `MstFranchiseTaxRegistration` and `TaxRegistrationService` live in `tax-engine` (tagged platform). Franchise, member and reports import it; `tax-engine` imports no feature module.
  - **Scope:** the same rule as 3b (`allFranchises`); one helper is shared with `TaxMasterService`.
  - **Sync in both directions for this release:**
    - a registration save mirrors the active home registration into `mst_franchises.gst_number` / `vat_number`
    - the franchise form's GST / VAT fields (still on the form until group 13) upsert or deactivate the home registration, validated only when the value changes (GSTIN check, UAE TRN)
  - **CRUD DTO:** no prefix / format / FY start yet (validated with them in group 11).
  - **Invoices:** the mapper takes an optional `IInvoiceRegistration`. Callers pass the home registration active on the invoice date; group 6 passes the sale's stored `tax_registration_id` instead.
  - **Admin:** franchise list / details return `gstRegistered` (registration-based) for the turnover badge. The invoice-numbering form keeps reading the live GSTIN field while it is on the form.
  - **Functional currency:** no `currency_code` → no FX and a warning, as today for a country without a currency.
- **Gate:**
  - unit tests
  - curl CRUD
  - A23b
  - an existing PDF prints the same supplier GSTIN; a HCUAE PDF prints the test TRN
  - an EFMUM invoice still records INR
  - A30 (issue)
  - baseline green

> **As built (group 4, 2026-10-25):**
> - **`tax-engine`:** `MstFranchiseTaxRegistration`, `TaxRegistrationService` and `TaxFranchiseScope` (shared with Tax Master), plus `franchise-tax-registrations/:franchiseId` (GET / POST / PUT `/:id` / PATCH `/:id/status`, TaxMaster rights, scoped).
>   - Numbers are checked with `TaxRegistrationNumberUtil`; the GST State comes from the GSTIN.
>   - The currency defaults to the country's. Overlap is checked per country and system, and an active number belongs to one registration.
>   - Prefix / format / FY start are refused until group 11.
> - **Readers moved to registrations:**
>   - the engine (GST in India, VAT in the supplier country, on the supply date), and the Tax Master VAT-rule check (`hasActive`)
>   - turnover service and cron (Indian GST on the local date), documents issued (`registeredBetween` the period)
>   - franchise list / details: `gstRegistered`, `currencyCode`
>   - the invoice scopes lose `gstNumber` / `vatNumber`; the two PDF builders pass `InvoiceIssueService.invoiceRegistration(...)` to the mapper's new `registration` argument (seller number, label and QR GSTIN)
>   - the admin turnover badge reads `gstRegistered`
> - **Wiring:** `FranchiseModule` and `ReportsModule` import `TaxEngineModule`.
> - **4.3:** `InvoiceIssueService.franchiseContext` takes the functional currency from `franchise.currency_code`. The franchise DTO accepts `currencyCode`, and a new franchise takes its country's.
> - **Live:**
>   - CRUD and A23b: 19/19, with a test UAE registration on EFMUM, deactivated afterwards
>   - the 4 PDFs' text identical (EFMUM GSTIN ×2, HCUAE TRN, MEMUM none)
>   - EFMUM / HCUAE / MEMUM functional currency INR / AED / INR
>   - 12 `calculate-tax` cases identical, A3 identical
> - **Review:** a subagent found 6 issues (the form half-writes on a refused number; form changes rewrite registration history; no overlap check from the form; 164 old EFMUM invoices losing their GSTIN; fallback time zone; tests that didn't bite) plus plausible ones. Fixed as group 4b.


## Group 4b: Review fixes for registrations (subagent review, 2026-10-25)

- [x] 4b.1 **The franchise form never half-writes** (finding 1).
  - Before any write, the form's home-system number goes through every check the sync will make: format, a number already held by another franchise, and overlap.
  - The sync acts only when the number differs from the **stored column**. So a legacy value that 146 skipped, or one whose registration was ended, is left alone, as D10 wants.
  - A client that omits the field leaves both the column and the registration untouched (before, the column was cleared).
- [x] 4b.2 **Form changes keep history** (findings 2 and 3).
  - A changed number ends the current home registration yesterday and opens a new one from today. A cleared number ends it yesterday.
  - A row that hadn't started yet is deactivated instead.
  - The new row is overlap-checked like any other.
- [x] 4b.3 **Issued PDFs keep their GSTIN** (finding 4).
  - The problem: EFMUM has 164 invoices dated 2017-04-28 to 2017-10-04, before its franchise start date.
  - Migration 146 now starts a back-filled registration at the earliest of the franchise start date and its issued documents. It also lowers `effective_from` on rows it back-filled before (marked `created_ip = ':0'`), never raising it.
  - Principle 10 wins over the exact GST start date: a re-downloaded PDF must not change.
- [x] 4b.4 **Smaller fixes:**
  - The invoice-date fallback uses the franchise's time zone (finding 5).
  - Registration PUT keeps the stored currency when none is sent. A franchise save with an empty currency falls back to the country's.
  - `TaxRegistrationNumberUtil.normalize` strips every non-alphanumeric, as 146 does.
  - The franchise list reads GST status in one query.
- [x] 4b.5 **Tests that bite** (finding 6):
  - pure helpers for "effective on a date" and "periods overlap", tested directly, including the open-ended cases
  - the registration spec asserts the real column mirror
  - the engine spec asserts the supply date passed to `findActive`, and an unregistered result for a supply before the registration
- Logged, not fixed: the tax admin controllers are mounted in public-api through `MemberModule` → `TaxEngineModule` (pre-existing for Tax Master / LUT / exchange rates; roadmap 4.4).
- **Gate:** group 4's gate again, plus every issued EFMUM / HCUAE / MEMUM invoice prints the tax number it printed before 146. That is checked by SQL over all issued documents (seller-number rule old vs new), plus the 4 PDFs.

> **As built (group 4b, 2026-10-25):**
> - **One planner** (`planFranchiseForm`) serves both the pre-write check (`assertFranchiseFormNumbers`, now async and run before any franchise write) and the sync, so they can't disagree.
>   - It acts only when the number differs from the stored column, and only when the field was sent.
>   - A change ends the current registration yesterday (deactivates it if it starts today) and opens a new one today, overlap-checked.
>   - The franchise update writes `gst_number` / `vat_number` only when sent.
> - **Date logic:** `isEffectiveOn` / `periodsOverlap` / `dayBefore` are the date logic. Queries fetch the franchise's rows and the helpers filter them.
> - **146:** back-fills from `least(start_date, first issued payment / order / credit note)` and lowers untouched back-filled rows. `eatfit`: EFMUM's registration now starts 2017-04-28. A clone re-run is identical, with 30 constraint cases.
> - **Smaller fixes:**
>   - `documentDate` takes the franchise time zone (the invoice scopes include `timeZone`)
>   - a registration PUT keeps the stored currency; a franchise update with an empty currency takes the country's
>   - `normalize` keeps letters and digits only
>   - the franchise list makes one GST-status query
> - **Specs:**
>   - an in-memory registrations fake: 25 cases. Mutants caught: `effective_to` exclusive (3 failures), the form change deactivating instead of ending (2 failures)
>   - engine: the supply date passed to `findActive`; unregistered before the registration starts; VAT with no registration → 400
> - **Live:**
>   - CRUD and A23b 19/19
>   - the 4 PDFs identical; over **all 5,342 issued documents** the seller number now equals the one printed before (0 mismatches: EFMUM 5,238 from 2017-04-28, HCUAE 11, MEMUM 93 none)
>   - franchise form on MEMUM: an invalid GSTIN and EFMUM's GSTIN both refused with nothing written (a brand change in the same request did not land); valid → registration from today; omitted → kept; cleared → deactivated (it had started today); the MEMUM row is back to its starting values
>   - 12 `calculate-tax` cases identical, A3 identical
> - **Test data left in `eatfit`** (inactive, soft-deleted): EFMUM test UAE registrations 3 and 5, MEMUM sample-GSTIN registrations 4 and 6.


## Group 5: Backend: rule resolver, guardrails, preview (tax)

- [x] 5.1 `TaxMasterService.resolve(facts)` with `TaxRuleMatchUtil`; no match → today's 400.
- [x] 5.2 Save-time validation: every D7 block and warning; warnings require `legal_basis`.
- [x] 5.3 `POST tax-master/preview` (`TaxMaster` Read, scoped): the winning rule, the runners-up and any shadowing warning. The computed tax is added in group 6.
- **Gate:** unit tests; A7, A8, A12a, A22 (rules) and A31 by curl; A23c; pricing unchanged; baseline green.

> **As built (group 5, 2026-10-25):**
> - **`TaxRuleGuardrailsUtil`** (shared, for group 13's inline messages): `blocks` (every D7 block and every DB CHECK of 146, so a refused save is a 400), `warnings` (D7, plus `SEEDED_RULE_EDIT`), `fallbackBlocks` (A31).
> - **`TaxMasterService`:**
>   - `resolve` / `resolveOrThrow` (5.1; today's "No active tax rule …" 400)
>   - `preview` + `facts` (5.3)
>   - `validated`: the guardrails, the VAT registration for an active VAT rule, the foreign registration, the fallback row and D4 duplicates; warnings need a legal basis
>   - `draftOf` merges a partial body over the stored row
>   - `changeStatus` reruns the checks on reactivation and refuses to deactivate a fallback in use
>   - the unique index (and a missing foreign key) map to 400
>   - saves return `{ id, warnings }`; `POST tax-master/preview` (TaxMaster Read, scoped)
> - **Facts:** domestic money = the franchise's own currency (no INR literal); B2B = a valid customer GSTIN / TRN; electronic from `mst_program_plans` by name.
> - **Live:** A7 / A8 / A12a / A31 / A22 / A23c 33/33; the QA rules created were deactivated.
> - **Review:** a subagent found 7 issues, two of them serious: today's form narrowed ALL goods rules to one product, and picker dates were saved a day early. Fixed as group 5b.


## Group 5b: Review fixes for the guardrails (subagent review, 2026-10-25)

- [x] 5b.1 **Today's form never narrows an ALL rule** (finding 1). The problem: MEMUM's refusal (row 7) or HCUAE's goods export would have become one product's rule. `appliesTo` now changes only when it is sent, or when the transaction type or the reference changes **value**.
- [x] 5b.2 **A picker date is the day the admin chose** (finding 2). The problem: today's form posts local midnight as a UTC timestamp, so 1 Dec in IST arrives as 30 Nov 18:30Z. A timestamp is read as its nearest UTC midnight, which is right for any admin between UTC−11 and UTC+11. Group 13's form sends `YYYY-MM-DD`.
- [x] 5b.3 **The IGST-on-foreign-money warning also covers money ANY** (finding 3), for any GST CHARGE rule that can match a sale abroad (scope ANY, ANY_FOREIGN or a specific country) unless money is DOMESTIC.
- [x] 5b.4 **Fallbacks stay valid** (finding 4).
  - Saving a rule that active rules use as their fallback re-checks it against each of them.
  - A fallback's dates must cover its rule's.
- [x] 5b.5 **Smaller fixes:**
  - a rule can be created staged (`active: false`), so it can be prepared before its registration (finding 5)
  - the preview takes the franchise's own currency when none is sent (finding 6)
  - leaving a specific-country scope clears the country (finding 7)
  - a FOREIGN_REGISTRATION rule needs a registration of its own tax system in that country
  - an unknown franchise is a 404, not a database error
  - a rule's supplier country must be its franchise's country
  - editing a seeded rule's tax fields needs an updated legal basis, while a save that changes nothing tax-related needs none
- [x] 5b.6 **Tests that bite:** updates sent with the form's full body; a staged VAT rule; a picker date; a fallback edited after use; money ANY; country clearing.
- **Gate:** group 5's gate again plus a case per finding; seeded rows 7 and 11 saved through today's form stay ALL.

> **As built (group 5b, 2026-10-25):**
> - **Fixes:**
>   - `referenceMoved` compares values (5b.1)
>   - `TaxMasterService.day` rounds a timestamp to its nearest UTC midnight (5b.2)
>   - the GST-on-foreign-money warning covers money ANY and scope ANY (5b.3)
>   - `fallbackBlocks` checks dates, and `validated` re-checks every active rule that uses the saved rule as its fallback (5b.4)
>   - create takes `active` (staged); the preview's currency defaults to the franchise's; a non-specific scope clears the country; FOREIGN_REGISTRATION checks `hasActive(taxSystem, country)`; an unknown franchise is a 404; the rule's country must be the franchise's; a seeded rule's tax change needs a changed legal basis, while an unchanged save passes (5b.5)
> - **Specs:** updates send today's form body (picker `Date`). Mutants caught: always recompute applies-to (2 failures), UTC day (4), no dependent re-check (1), no seeded-basis check (1).
> - **Live:**
>   - today's form re-saved seeded rows 7, 11 and 1 with IST-midnight timestamps: ALL kept, dates kept (2017-07-01, 2025-12-31, 2015-12-31)
>   - group 5 33/33, A23a 20/20, A23b 12/12
>   - 12 `calculate-tax` cases identical, A3 identical, rules 1–11 unchanged


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
- [ ] 13.6 *(from the group 3 browser check)* The API returns `countryCode` trimmed and `referenceId` as a number; today `'AE '` (char(3)) and `'1'` (bigint string) leave the form's Buyer Country and Applies to empty, so a legacy rule can't be re-saved from the form (pre-existing).
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

## Replanning notes (for a `replan/configurable-tax-treatment` branch)

Recorded by group 0 (0.3). The constitution is **not** edited on this feature branch (CLAUDE.md: constitution changes go on a `replan/<topic>` branch); group 15.5 carries these into that branch.

1. **mission.md principle 1 (Tax at payment).** Its last sentence reads "Domestic vs export is decided by comparing the supplier's country with the customer's country, and that decision is stored too." Proposed:
   > Domestic vs export is decided by the Tax Master treatment rule that matches the sale; the comparison of countries is one of its conditions. The rule, the registration and the decision are stored with the sale.
2. **mission.md Markets table.** Proposed rows (the Tax column states the configured default; the treatment itself is Tax Master configuration, and the Indian-client refusal stays a code invariant):

   | Market | Franchise | Payments today | Tax (configured default) |
   |---|---|---|---|
   | India, diet programs (services) | EatFit247 (EFMUM), currency INR | **Entered by an admin** (website down since 2026-10-25; Razorpay returns with it) | GST 18%: CGST+SGST in Maharashtra, IGST elsewhere; customer State (or the B2B GSTIN's State) on every invoice |
   | India, debloat powder (goods) | Mahi Enterprise (MEMUM), currency INR | Entered by an admin, courier delivery | Unregistered: no GST, intra-state only (seeded REFUSE rule for other States). Once registered, GST at the configured rate (HSN 3004) |
   | Non-Indian customers of the Indian franchises | EFMUM / MEMUM | Entered by an admin (foreign remittance or Indian rails) | Export of service or goods under LUT (0%, export invoice series); a foreign client paying INR over Indian rails gets IGST 18% |
   | UAE and other countries, diet programs | Partner (Dubai, HCUAE), currency AED | Entered by an admin | UAE VAT per the configured rules: UAE clients 0% Z (Art 41, adviser) or 5% S; clients outside the UAE zero-rated exports with evidence, else the rule's fallback |
   | Indian customers of a partner franchise | — | — | **Refused** (code invariant). Indian clients are always served by the India franchise (avoids OIDAR registration abroad) |

   Add under the table: "Each franchise states its working currency (`mst_franchises.currency_code`); a tax registration abroad carries its own currency." The line "Telr (UAE) and Stripe (international) … not live" stays; add that Razorpay is also paused while the website is down.
3. **tech-stack.md § Data Conventions, new bullet:**
   > No feature switch in `mst_configs` or env. A tax behaviour or feature switch lives in the master that owns it (Tax Master, tax registrations, `mst_email_templates`). `DIET_SAC_CODE` is the one exception. A retired config row gets `module = 'Retired'`; rows are never deleted.

   The same bullet's neighbour "`db_changes/` … currently at 135" is stale (the next number is 146); fix it in the same replan.
