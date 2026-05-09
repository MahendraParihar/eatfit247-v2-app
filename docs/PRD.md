# Product Requirements Document (PRD)

# EatFit247 v2 — Health & Nutrition Coaching Platform

**Version:** 2.0
**Date:** 2026-05-09
**Status:** Active Development

---

## 1. Problem Statement

Nutrition coaching businesses rely on fragmented, manual workflows — diet plans in spreadsheets, communication over WhatsApp, invoices generated manually, and no centralized system for tracking member health progress. This leads to inconsistent service quality, tax compliance risks, poor member retention, and an inability for franchise owners to scale beyond a handful of nutritionists. Members lack a structured digital experience for their health journey, making it easy to disengage.

---

## 2. Solution

EatFit247 v2 is a full-stack platform that digitizes the complete nutrition coaching lifecycle across three interfaces:

- **Public Website** (Angular SSR): Member-facing portal for signup, program discovery, checkout, health tracking, content consumption, and product ordering.
- **Admin CMS** (Angular SPA): Internal portal for nutritionists, franchise owners, and super admins to manage members, diet plans, payments, products, content, and reports.
- **Backend APIs** (NestJS): Two REST APIs — public-api (port 3000) serving the website and admin-api (port 3001) serving the CMS — sharing a common library layer with strict architectural boundaries.

The platform handles multi-geography operations (India, UAE, international) with jurisdiction-specific tax engines, payment gateways, and courier integrations out of the box.

---

## 3. User Stories

### Member Registration & Onboarding
1. As a prospective member, I want to register with my email and phone number, so that I can create an account on the platform.
2. As a new member, I want to verify my email via OTP, so that my account is secured.
3. As a new member, I want to fill out a comprehensive health assessment covering my demographics, eating habits, health conditions, lifestyle, and medical history, so that my nutritionist has the data needed to create a personalized plan.
4. As a member, I want my assessment to capture specific parameters like blood sugar levels, cholesterol readings, blood pressure, allergies, exercise habits, and sleep patterns, so that my diet plan accounts for my complete health profile.
5. As a female member, I want to provide menstrual cycle information in my assessment, so that my nutritionist can factor hormonal health into my diet plan.

### Program Selection & Payment
6. As a member, I want to browse available nutrition programs and their plans, so that I can choose one that fits my goals and budget.
7. As a member, I want to see plan details including cycle duration, number of days per cycle, pricing, and online/offline mode, so that I can make an informed selection.
8. As a member, I want to apply a promo code at checkout, so that I can receive a discount on my subscription.
9. As a member, I want the system to validate my promo code for active status, date validity, usage limits, and minimum order amount, so that only legitimate discounts are applied.
10. As a member in India, I want to pay via Razorpay in INR with correct GST calculation, so that my payment is processed with a tax-compliant invoice.
11. As a member in UAE, I want to pay via Telr in AED with correct VAT calculation, so that my payment complies with local tax regulations.
12. As an international member, I want to pay via Stripe in USD, so that I can subscribe regardless of my country.
13. As a member, I want to receive a PDF invoice with tax breakdown after payment, so that I have a formal receipt for my records.
14. As a member, I want my invoice to be sequentially numbered per my franchise's financial year, so that invoices are audit-compliant.

### Diet Plan & Nutrition
15. As a member, I want to receive a personalized diet plan after successful payment, so that I can start my nutrition program.
16. As a member, I want my diet plan organized by cycles and days with specific recipes for each meal, so that I have clear daily guidance.
17. As a member, I want each recipe in my diet plan to include ingredients, preparation method, serving size, and nutritional values, so that I can follow it accurately.
18. As a member, I want to download my diet plan as a PDF, so that I can access it offline.
19. As a member, I want to view recipes categorized by meal type, cuisine, and dietary preference (veg/non-veg/vegan), so that I can explore alternatives.
20. As a member, I want to access pocket guides (educational PDFs) personalized with my name, so that I have reference material for healthy eating.

### Health Tracking & Progress
21. As a member, I want to log my daily health parameters (weight, blood pressure, blood sugar, cholesterol), so that my progress is tracked over time.
22. As a member, I want my nutritionist to see my health parameter history, so that they can adjust my diet plan based on my progress.
23. As a member, I want to report health issues (gas, bloating, constipation, hair fall, etc.) through the platform, so that my nutritionist can address them.

### Consultations & Communication
24. As a member, I want to have scheduled consultations with my nutritionist via Google Calendar integration, so that I receive timely guidance.
25. As a member, I want to receive email confirmations when my consultation is scheduled, rescheduled, or cancelled, so that I stay informed.
26. As a member, I want to receive WhatsApp notifications for key events (plan assigned, payment confirmed, consultation booked), so that I get timely updates on my preferred channel.
27. As a member, I want to receive a welcome email after signup, so that I feel onboarded.
28. As a member, I want to reset my password via email, so that I can recover account access.

### Product Ordering & Delivery
29. As a member, I want to browse a product catalog with supplements and health foods, so that I can complement my diet plan.
30. As a member, I want to select product variants (different sizes/weights) and see pricing in my currency, so that I can choose the right option.
31. As a member, I want the system to check pincode serviceability before I place an order, so that I know if delivery is available to my address.
32. As a member, I want to track my order status in real-time (booked, picked up, in transit, delivered), so that I know when to expect delivery.
33. As a member, I want to receive a product invoice with HSN codes and tax breakdown, so that my purchase is documented.

### Content & Engagement
34. As a member, I want to read health and nutrition blog articles, so that I can educate myself beyond my diet plan.
35. As a member, I want to comment on blog articles and receive admin responses, so that I can engage with the content.
36. As a member, I want to read success stories from other members, so that I feel motivated.
37. As a member, I want to submit my own testimonial and rating under a specific category (Program or Product), so that I can share my experience with the relevant service or product.
38. As a member, I want to browse FAQs for my specific program, so that I can find answers without contacting support.
39. As a member, I want to submit a contact form inquiry, so that I can reach the support team.

### Referral
40. As a member, I want to be attributed to a referrer when I sign up through a referral link, so that my referrer gets credit.

---

### Nutritionist / Coach (Admin User)
41. As a nutritionist, I want to view a list of all my assigned members with filters and sorting, so that I can manage my caseload.
42. As a nutritionist, I want to review a member's health assessment, so that I can understand their baseline health.
43. As a nutritionist, I want to create a diet plan from a template and customize it for a specific member, so that I can efficiently deliver personalized plans.
44. As a nutritionist, I want to organize diet plans into cycles with daily meal variations, so that members get variety over their program duration.
45. As a nutritionist, I want to link specific recipes to each meal slot in a diet plan, so that members get actionable instructions.
46. As a nutritionist, I want to manage a recipe database with ingredients, preparation methods, nutritional values, categories, and cuisines, so that I have a reusable recipe library.
47. As a nutritionist, I want to view a member's health parameter history (weight, BP, blood sugar over time), so that I can track their progress.
48. As a nutritionist, I want to log consultation calls with date, time, duration, type, purpose, and notes, so that I maintain a record of member interactions.
49. As a nutritionist, I want to schedule consultations that sync with Google Calendar, so that both the member and I have calendar reminders.
50. As a nutritionist, I want to send notifications to members via email and WhatsApp, so that I can communicate updates.
51. As a nutritionist, I want to assign pocket guides to members, so that they have supplementary educational material.
52. As a nutritionist, I want to view and resolve member-reported issues, so that I can provide responsive support.
53. As a nutritionist, I want to create diet plan PDFs for a member, so that they have a printable version.

### Franchise Owner
54. As a franchise owner, I want to view member reports (total, active, by program, by location), so that I can track business growth.
55. As a franchise owner, I want to view revenue reports (by plan, by payment gateway, by period), so that I can monitor financial performance.
56. As a franchise owner, I want to manage my franchise details (company info, tax IDs, financial year), so that invoices and reports are accurate.
57. As a franchise owner, I want to manage multiple locations with addresses and contact details, so that I can operate across geographies.
58. As a franchise owner, I want my franchise's data (members, payments, reports) to be isolated from other franchises, so that business data remains confidential.
59. As a franchise owner, I want to manage products available to my franchise with franchise-specific pricing, so that I can sell relevant products.
60. As a franchise owner, I want to configure courier accounts for my franchise, so that product delivery uses my logistics partners.
61. As a franchise owner, I want to manage promo codes with discount rules, validity periods, and usage limits, so that I can run targeted promotions.
62. As a franchise owner, I want to publish success stories and manage testimonial approvals (for both Program and Product categories), so that I can build social proof.
63. As a franchise owner, I want to manage blog content with authors, categories, and publishing workflow, so that I can drive member engagement.
64. As a franchise owner, I want to export reports to CSV, so that I can analyze data in external tools.

### Super Admin
65. As a super admin, I want to manage all franchises and their configurations, so that I can onboard new franchise partners.
66. As a super admin, I want to create and manage admin user accounts with role-based permissions, so that each user has appropriate access.
67. As a super admin, I want to define roles with granular permissions (create/read/update/delete per subject), so that access control is fine-grained.
68. As a super admin, I want to manage master data (countries, states, currencies, payment gateways, payment modes), so that the platform supports new geographies.
69. As a super admin, I want to manage programs and their plan configurations (cycles, pricing, visibility), so that the product catalog stays current.
70. As a super admin, I want to view cross-franchise reports, so that I have a holistic view of platform performance.
71. As a super admin, I want to manage tax rules with jurisdiction, rates, and effective dates, so that tax calculations are always compliant.
72. As a super admin, I want to manage email and WhatsApp notification templates, so that communication is consistent.
73. As a super admin, I want to manage SEO metadata for public-facing pages, so that the website ranks well in search engines.
74. As a super admin, I want to manage banner content for the public website, so that marketing campaigns are visible to visitors.
75. As a super admin, I want to manage press and media content, so that brand coverage is showcased.
76. As a super admin, I want to see an audit trail of all data changes (who changed what, when, from which IP), so that I can investigate issues.

---

## 4. Implementation Decisions

### Architecture
- **Monorepo with NX**: Backend is an NX workspace with strict 6-layer dependency hierarchy (shared-dto → core → platform → modules → admin-only → apps). Module boundaries are enforced by ESLint rules and NX tags.
- **Two API applications**: admin-api (port 3001, 32 modules) and public-api (port 3000, 12 modules) share the same library layer but expose different module subsets. This keeps the public API surface minimal.
- **Feature module isolation**: 28 self-contained NestJS modules, each owning its controllers, services, models, and DTOs. Cross-module data access uses Sequelize string-based model resolution to avoid circular imports.

### Data Layer
- **PostgreSQL with Sequelize ORM**: All models use `@Table`/`@Column` decorators with explicit `field` mapping from camelCase properties to snake_case columns.
- **Model registry pattern**: Feature modules register their Sequelize models in a global registry before database initialization. This allows the core layer to bootstrap all models without importing feature modules directly.
- **Scope-based queries**: Models define `@Scopes()` with `list` and `details` presets that include standard associations (creator/updater user info, related entities). Services call `Model.scope('list').findAndCountAll()` instead of writing raw includes.
- **Master vs. transactional tables**: `mst_*` tables hold reference data (countries, programs, recipes); `txn_*` tables hold operational data (members, payments, orders).

### Authentication & Authorization
- **JWT + Refresh Token**: Short-lived access token (15min, in-memory) paired with a long-lived refresh token (7 days, HttpOnly Secure cookie). Refresh endpoint issues new access tokens without re-login.
- **CASL permissions**: Role-based ability checking at the controller level. Each admin role maps to a set of allowed actions (create/read/update/delete) on subjects (member, diet-plan, payment, etc.).
- **Checkout token**: Public checkout sessions use HMAC-SHA256 tokens instead of JWT, allowing unauthenticated users to complete payment flows.

### Payment Processing
- **Gateway resolver**: `PaymentGatewayResolverService` auto-selects Razorpay, Stripe, or Telr based on the member's country and franchise configuration. Gateway selection is not exposed to the member.
- **Tax-at-payment-time**: Tax amounts are calculated and stored when payment is made. Invoices and PDFs render the stored tax values — they never re-calculate.
- **Invoice sequencing**: Sequential invoice numbers per franchise, per invoice type (PRODUCT/SERVICE), per financial year. Format: `GST/INV/{franchise_code}/{currency}/{YYYYMM}/{sequence}`.
- **Webhook-driven status**: Payment gateways send webhook callbacks to update payment status (pending → paid/failed/refund).

### Delivery System
- **Multi-courier orchestration**: Rate quotes requested in parallel from Nimbus Post, Shiprocket, and Shipway. System auto-selects or allows manual courier selection.
- **Pincode serviceability caching**: Courier serviceability results cached per pincode with configurable expiry.
- **Shipment state machine**: Draft → Rate Requested → Rate Selected → Booking Requested → Booked → Pickup Scheduled → In Transit → Out for Delivery → Delivered (with RTO/Failed/Cancelled branches).

### Notification System
- **Email**: EJS templates rendered by `EmailNotificationService` via Nodemailer. 11 template types covering the member lifecycle.
- **WhatsApp**: Pre-approved Meta templates with parameter substitution. 8 template types for critical notifications.
- **Event-driven dispatch**: NestJS `EventEmitter` triggers async notification sending, decoupled from the request/response cycle.
- **Delivery tracking**: All notifications logged with status (pending/sent/failed), full payload, and response for retry capability.

### PDF Generation
- **Puppeteer + Handlebars**: PDF service renders Handlebars templates to PDF via headless Chrome. Used for invoices, diet plans, and recipes.
- **Template partials**: Shared header/footer components across PDF types.

### Content Management
- **Blog workflow**: Articles with authors, categories, tags. Supports draft/published states, comments with admin responses, and subscriber email distribution on publish.
- **Approval workflows**: Testimonials (categorized as Program or Product) and success stories go through admin approval before public visibility.

### Caching
- **Redis via cache-manager**: Master data (labels, countries, payment gateways) cached in Redis to reduce database load on frequently-accessed reference data.

### Monitoring & Error Handling
- **Sentry**: Error tracking on public-api for production incident detection.
- **Prometheus**: Metrics endpoint for infrastructure monitoring and alerting.
- **Standard error envelope**: All errors return `IErrorResponse` with code, message, and details. Global exception filter catches unhandled errors.
- **Standard response envelope**: All successful responses wrapped in `IResponse<T>`: `{ code, message, data }`.

---

## 5. Testing Decisions

### Testing Philosophy
- Test external behavior, not implementation details. Tests should verify what the system does (API inputs/outputs, state changes), not how it does it internally.
- Focus testing on modules with complex business logic — tax calculation, payment orchestration, diet plan generation, and shipment state management.

### Modules Requiring Tests
- **Tax Engine**: Multi-jurisdiction tax calculation (GST IGST vs CGST+SGST, VAT, effective date rules) — highest risk of compliance errors.
- **Payment Module**: Gateway selection logic, webhook processing, payment status transitions, invoice sequencing.
- **Diet Module**: Diet template to personalized plan transformation, cycle/day structure validation.
- **Delivery Module**: Shipment state machine transitions, courier rate comparison, pincode serviceability.
- **Auth Module**: JWT issuance/refresh, CASL ability generation, checkout token validation.
- **Promo Code Module**: Discount validation rules (dates, limits, minimums, program eligibility).

### Test Infrastructure
- **Jest** as the test runner with `ts-jest` for TypeScript support.
- **NX test targets**: `npx nx test <project-name>` runs tests for a specific library. `npm run test` runs all.
- `npm run test:cov` for coverage reports.
- `@nestjs/testing` for module-level integration tests.

---

## 6. Out of Scope

- **Mobile native apps**: No iOS/Android apps — members use the responsive web platform.
- **Video consultations**: Consultations are phone-based; no Zoom/Meet video calling integration.
- **AI diet generation**: Diet plans are manually created by nutritionists using templates — no AI/ML recommendation engine.
- **Multi-language support**: Platform operates in English only; no i18n framework.
- **Real-time chat**: No live chat between members and nutritionists.
- **Wearable integration**: No sync with fitness trackers (Fitbit, Apple Watch, Garmin).
- **Member-facing dashboards**: No graphical charts/analytics visible to members (health data is logged but visualized only in admin reports).
- **SMS notifications**: Only email and WhatsApp are implemented; SMS channel is not yet integrated.
- **Cloud object storage**: File uploads use filesystem storage, not S3/GCS.

---

## 7. Further Notes

### Multi-Tenant Data Isolation
All queries in the admin context are scoped to the logged-in user's franchise. The `currentUser` decorator extracts franchise ID from the JWT, and services filter all database queries accordingly. Super admins can bypass franchise scoping for cross-franchise reporting.

### Shared Library Contract
The `shared-library` package (`@eatfit247-shared-lib`) serves as the contract between frontend and backend. All interfaces used by both sides are defined there. Changes to shared interfaces require rebuilding the library before either frontend or backend can consume them.

### Database Migrations
SQL migration scripts are maintained in `/db_changes/` (113+ files). Migrations are applied manually — there is no automated migration runner. The naming convention provides ordering by sequence number.

### Deployment
- Docker Compose orchestration via `/infra/docker-compose.yml`
- Nginx reverse proxy configuration in `/infra/`
- PM2 process management via `ecosystem.config.js` for non-Docker deployments
- Environment configuration via `.env` files (backend) and `main.env` (Docker)
