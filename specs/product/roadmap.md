# Roadmap

> Last updated: 2026-10-10 (replan after the accounting audit)
>
> Status legend: ✅ shipped · 🚧 in progress · 📋 planned · 🔍 needs verification
>
> Each numbered item (e.g. `4.2`) is one feature: one branch and one `specs/features/<date>-<slug>/` folder (requirements, plan, validation). Keep items small enough to review in one sitting. Split them during replanning if needed. When an item ships, tick it and link its folder. See [specs/README.md](../README.md).

## Shipped: Phases 0–3 ✅

v2 is live in production.

**Foundation:** NX monorepo with a layered backend; public-api and admin-api; JWT + refresh-cookie auth; `@eatfit247-shared-lib`; Docker Compose + Nginx on a single VPS; Sentry (public-api) and Prometheus; LOV and location masters; franchise registration by Super Admin.

**Coaching and commerce:** programs, seasonal plans and per-currency pricing; member management (assessment, health parameters, diet plans, call logs, issues, addresses, products, payments); diet templates tied to programs, recipes, PDFs; Razorpay payments (live) with the Stripe/Telr adapters built; promo codes; tax engine and universal invoice formats (DOMESTIC_GST + QR, EXPORT_OF_SERVICE, VAT, NO_TAX); products with variants and HSN; multi-courier delivery (Nimbus Post, Shiprocket, Shipway) with hardened booking (`132`, `133`); email and WhatsApp notifications; payment report filters (`135`).

**Access and scheduling:** database-driven RBAC with a matrix UI (`113`, `116`, `117`, `120`); multi-franchise mapping for admin users; Appointment Management with Google Calendar two-way sync and reminders (`118`, `119`).

**Content and growth website:** SSR public site (programs, seasonal plans, book session, products, checkout, blog, success stories, press, FAQ, quizzes, legal); blogs, success stories (`131`, `134`), testimonials, Google reviews (`122`, `123`), FAQs, banners, SEO pages, referrers, pocket guides.

## Phase 4: Finance and Content Fixes 🚧 (now)

- ↪️ **4.1 Invoice numbering for non-Indian customers of the Indian franchise.** Moved to **4.7**, which now runs after the tax-engine fix (4.6) following the 2026-10-10 accounting audit.
- 🚧 **4.2 Pocket-guide download URL.** Provide a working download link in the admin Pocket Guide screen and the member's Pocket Guide tab. Code complete; awaiting production rollout and the remaining manual checks. See [specs/features/2026-10-04-pocket-guide-download](../features/2026-10-04-pocket-guide-download/).
- ❌ **4.3 Apr–Jun 2026 invoice regeneration.** Cancelled 2026-10-10: Q1 FY 2026-27 GST returns are filed, so Q1 invoice numbers are frozen. Reopen only if Accounts asks.
- 🔍 **4.4 Franchise-scope audit.** Check whether CASL franchise conditions are actually enforced (PRD-RBAC §4 finding 1: `ability.can(action, subject('X', { franchiseId }))`) across admin endpoints, especially for nutritionists mapped to several franchises and for partner-franchise owners. Fix any leakage, with tests.

### Finance compliance (from the [2026-10-10 accounting audit](../backlog/2026-10-10-accounting-audit.md)) 📋

Build in this order: each item depends on the ones above it. Audit finding IDs are in brackets. Tax and invoice items are implemented one task group at a time.

- ✅ **4.5 Checkout and webhook lockdown (P0).** Shipped 2026-10-10 on `feature/10-10-2026-checkout-lockdown` ([spec](../features/2026-10-10-checkout-lockdown/requirements.md)).
  - Public checkout can no longer set payment status, source, date or discount; the server decides them, and promo codes are validated on the server.
  - Razorpay webhook statuses only move forward (a late "failed" can't overwrite PAID), and the payment row is locked before an invoice number is issued.
  - [C1, H7, M5]
  - Owner steps after merge (validation.md "Post-ship"): migration 139 on production, the suspicious-records run with Razorpay reconciliation for Accounts, and Safari, mobile and foreign-currency checks.
- 📋 **4.6 Tax-engine correctness (P0).**
  - Export vs domestic is decided by supplier country vs customer country, and the export branch actually runs.
  - ~~Fix the swapped supplier/customer arguments in product tax~~ (done in 4.5, plan 9.5); add an export-of-goods tax mode.
  - Rule for foreign clients who pay in INR.
  - LUT register with validity dates.
  - Required billing address (country and state) before tax is calculated; tax rule looked up by date and active flag.
  - [C2, C3, H10 rule, M2, M4 LUT]
- 📋 **4.7 Invoice series and proforma.** Was 4.1. Spec: [specs/features/2026-10-10-invoice-number-non-gst](../features/2026-10-10-invoice-number-non-gst/).
  - Separate export series; the invoice number is issued when the payment becomes PAID and is never removed.
  - Edits that would move an invoice between series are blocked.
  - Proforma PDF for unpaid entries.
  - Invoice date and financial year taken from the franchise's local date.
  - Renumber invoices from July 2026 (FY 2026-27 Q2) onward.
  - Depends on 4.6.
- 📋 **4.8 Invoice immutability.** Store a frozen copy of each invoice when it is issued, keep an append-only change log, and allow only non-financial edits after issue. [C4]
- 📋 **4.9 Credit/debit notes and receipt/refund vouchers.** Each in its own numbering series, linked to the original invoice; refunds and RTO trigger them. [C5]
- 📋 **4.10 Invoice particulars and FX.**
  - Exchange rate and INR/AED equivalents stored on each transaction.
  - Invoice shows place of supply, LUT number and export wording, reverse-charge line, amount in words and per-line tax.
  - [H1, H9, L3, M6]
- 📋 **4.11 Rate and classification master.** SAC/HSN codes and tax rates with effective dates, and a recheck of invoices issued since 22 Sep 2025. **Blocked on the CA's decision.** [H5, M3]
- 📋 **4.12 Explicit seller entity.** Name the selling franchise for products and for the checkout gateway, instead of taking the first match alphabetically. [H2]
- 📋 **4.13 Filing reports.** GSTR-1 workbook (B2B, B2CL, B2CS and EXP split; HSN summary; documents issued) and a UAE VAT-201 extract. [H4]

## Phase 5: Engineering Foundation 📋

Goal: every later feature ships with automated backend integration and e2e tests (see [tech-stack.md § Testing](./tech-stack.md#testing)).

- 📋 **5.1 Root CI.** Workflows currently sit in `server_1/.github/`, which GitHub does not run. Add root `.github/workflows` that builds `shared-library` and runs lint, test and build for all projects.
- 📋 **5.2 Migration runner.** Add a `schema_migrations` table and a script that applies pending `db_changes/*.sql` in order. Resolve the duplicate `115_*` numbers and baseline the current production state.
- 📋 **5.3 Backend integration test harness.** Seeded PostgreSQL test DB, reset per run, and Nest app bootstrapped for endpoint tests. Rewire the existing RBAC and appointment specs from in-file stubs to the real classes.
- 📋 **5.4 End-to-end test harness.** Playwright for admin and website against the running APIs + test DB. Smoke flows: admin login, member create, payment record; website enquiry and checkout.
- 📋 **5.5 Retro-fit tests for high-risk domains.** Tax engine, invoice sequencing (GST and non-GST), payment webhooks, promo codes, shipment state machine.
- 📋 **5.6 Ops hygiene.** Sentry on admin-api; Prometheus alert rules; align Prettier and NX versions across projects.

## Phase 6: Admin Angular 21 Upgrade 📋

- 📋 **6.1** Upgrade `eatfit247-admin` from Angular 20 to 21 (and Material, NX), with no behaviour change; the e2e suite from 5.4 is the safety net.
- 📋 **6.2** Convert feature libs from NgModules to standalone components + `inject()`, one batch of libs per feature spec.
- 📋 **6.3** Switch to zoneless change detection and remove `zone.js`.

## Phase 7: Franchise Operations 📋

- 📋 **7.1 Partner settlement and B2B invoice (EFMUM → HCUAE).** Track the per-customer amount each partner franchise owes EatFit247 (rate per franchise, customers per period, statement, paid/unpaid status), and issue EatFit247's export invoice to the partner company from the system. This replaces the Excel process. Depends on 4.7, 4.9 and 4.10. [H3]
- 📋 **7.2 Partner-owner experience.** Check that a partner owner's login sees only their franchise's members, payments and reports, and fill any reporting gaps they need.
- 📋 **7.3 Franchise onboarding checklist.** Steps Super Admin follows to bring a new country online: franchise record, tax config, invoice sequences, nutritionist mapping, gateway.
- 📋 **7.4 Goods export documentation (Mahi).** Shipping bill (CSB-V), port code, IEC, e-way bill, an export-realisation ageing report, and a monthly Export Declaration Form (EDF) extract for service exports. [H8, H10 registers]

## Phase 8: Online Payments for Partner Franchises 📋

- 📋 **8.0 UAE VAT compliance for HCUAE** (before 8.1).
  - Zero-rated (0%) category for clients outside the UAE, with evidence of where they live.
  - "Tax Invoice" title with the TRN, and AED amounts.
  - Tax Credit Notes.
  - Track e-invoicing readiness for the July 2027 deadline.
  - [H6, M9]
- 📋 **8.1 Telr go-live (Dubai).** Online checkout for Dubai-franchise customers, with webhooks, VAT invoices and reconciliation with offline records.
- 📋 **8.2 Stripe go-live (international).** Online checkout for customers in other partner countries.

## Phase 9: Member Self-Service Portal 📋 (later)

The website stays growth-first until this phase. Until then, members are served through staff, PDF, email and WhatsApp.

- 📋 **9.1** Member auth: signup, OTP, login, password reset
- 📋 **9.2** "My Plan": diet plan by cycle and day, recipes, PDF download, pocket guides
- 📋 **9.3** Self-serve assessment and health-parameter logging with history
- 📋 **9.4** Orders and live shipment tracking; issues; testimonial submission

## Phase 10: Reporting and Analytics 📋

- 🔍 **10.1** Audit existing reports against BR-9 and CSV export coverage
- 📋 **10.2** Enquiry → enrolment funnel (website growth)
- 📋 **10.3** Retention / re-enrolment, nutritionist efficiency, per-courier delivery success

## Later / Under Consideration

These need a mission-level decision before they become a phase: SMS; cloud object storage instead of filesystem media; members booking appointments themselves; Google Calendar inbound webhooks; member progress charts; i18n; native apps; video consultations; wearables; AI-assisted diet planning.

Finance follow-ups from the [accounting audit](../backlog/2026-10-10-accounting-audit.md), to be scheduled after Phase 4:
- an inventory/stock ledger for Mahi [M7]
- version master data (prices, HSN) instead of hard-deleting it [M8]
- a 16-character invoice number format from FY 2027-28 (GST Rule 46) [C6]
- e-invoicing readiness: India IRN if annual turnover passes ₹5 crore; UAE service-provider (ASP) appointment by 31 Mar 2027 if HCUAE makes B2B sales [M6]
