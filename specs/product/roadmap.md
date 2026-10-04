# Roadmap

> Last updated: 2026-10-04 (constitution interview)
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

- 🚧 **4.1 Invoice numbering for non-Indian customers of the Indian franchise.** Use the correct non-GST / export-of-service invoice sequence for foreign customers billed by EatFit247 India. Branch `invoice-seq-non-gst`.
- 📋 **4.2 Pocket-guide download URL.** Provide a working download link in the admin Pocket Guide screen and the member's Pocket Guide tab.
- 📋 **4.3 Apr–Jun 2026 invoice regeneration.** Reconcile `txn_member_payments` with the client Excel (Name + Amount + Location + Mode), fix dates, reissue `invoice_id`, and reset `mst_invoice_sequences`. (Data operation; depends on 4.1.)
- 🔍 **4.4 Franchise-scope audit.** Check whether CASL franchise conditions are actually enforced (PRD-RBAC §4 finding 1: `ability.can(action, subject('X', { franchiseId }))`) across admin endpoints, especially for nutritionists mapped to several franchises and for partner-franchise owners. Fix any leakage, with tests.

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

- 📋 **7.1 Partner settlement.** Track the per-customer amount each partner franchise owes EatFit247 (rate per franchise, customers per period, statement, paid/unpaid status). Replaces the Excel process.
- 📋 **7.2 Partner-owner experience.** Check that a partner owner's login sees only their franchise's members, payments and reports, and fill any reporting gaps they need.
- 📋 **7.3 Franchise onboarding checklist.** Steps Super Admin follows to bring a new country online: franchise record, tax config, invoice sequences, nutritionist mapping, gateway.

## Phase 8: Online Payments for Partner Franchises 📋

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
