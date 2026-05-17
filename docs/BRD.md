# Business Requirements Document (BRD)

# EatFit247 v2 — Health & Nutrition Coaching Platform

**Version:** 2.1
**Date:** 2026-05-09
**Last Updated:** 2026-05-09
**Status:** Active Development
**Changelog:** v2.1 — Added detailed RBAC role definitions (BR-8), Appointment Management feature (BR-10)

---

## 1. Executive Summary

EatFit247 is a multi-tenant health and nutrition coaching platform that connects members with certified nutritionists through a franchise-based business model. The platform digitizes the entire nutrition coaching lifecycle — from health assessment and personalized diet planning to payment processing, product delivery, and progress tracking — enabling franchise owners to scale their nutrition businesses across geographies and currencies.

---

## 2. Business Objectives

1. **Digitize nutrition coaching**: Replace manual spreadsheets and WhatsApp-based diet plan delivery with a structured, trackable digital platform.
2. **Enable franchise scalability**: Allow franchise owners to onboard nutritionists, manage members, and track revenue across multiple locations without operational overhead.
3. **Support multi-geography operations**: Handle India (GST, Razorpay, INR), UAE (VAT, Telr, AED), and international markets (Stripe, USD) from a single platform.
4. **Drive member engagement**: Provide members with personalized diet plans, health tracking, consultation scheduling, and educational content to improve retention and outcomes.
5. **Generate diversified revenue**: Monetize through subscription plans (nutrition programs), physical product sales (supplements, health foods), and franchise licensing.

---

## 3. Stakeholders

| Stakeholder | Role | Key Needs |
|-------------|------|-----------|
| **Members** | End users (health-conscious individuals) | Personalized diet plans, health tracking, easy payments, product ordering, consultation access |
| **Nutritionists / Coaches** | Service providers (admin users) | Member management tools, diet plan creation, assessment review, call logging, progress monitoring |
| **Franchise Owners** | Business operators | Revenue dashboards, member analytics, staff management, multi-location operations, tax-compliant invoicing |
| **Platform Admin (Super Admin)** | EatFit247 corporate | Cross-franchise oversight, master data management, content moderation, system configuration |
| **Referrers / Affiliates** | Member acquisition partners | Referral tracking, commission attribution |

---

## 4. Business Context & Problem Statement

### Current Challenges
- Nutrition coaching businesses operate on fragmented tools — Excel for diet plans, WhatsApp for communication, manual invoicing, no centralized member records.
- Franchise owners lack visibility into nutritionist performance, member engagement, and revenue metrics.
- Tax compliance (GST across Indian states, VAT in UAE) is manually managed, error-prone, and audit-risky.
- No standardized member onboarding — assessments are inconsistent, health data is not tracked longitudinally.
- Product fulfillment (supplements, health foods) is disconnected from the coaching experience.

### Business Opportunity
A unified platform that covers the entire member lifecycle — from first health assessment to ongoing coaching and product purchases — creates:
- Higher member retention through structured programs and progress visibility
- Reduced operational cost per franchise through automation
- Tax-compliant invoicing and multi-gateway payments out of the box
- Data-driven coaching through health parameter tracking over time

---

## 5. Business Requirements

### BR-1: Member Lifecycle Management
The platform must support the complete member journey:
- **Signup & Verification**: Email-based registration with OTP verification
- **Health Assessment**: Comprehensive questionnaire covering demographics, eating habits, health conditions, lifestyle, medical history (20+ parameters)
- **Program Enrollment**: Browse programs, select plans (varying by cycle duration, pricing tier, online/offline mode), complete payment
- **Diet Plan Delivery**: Receive personalized diet plans structured by cycle and day, with linked recipes
- **Health Tracking**: Log daily health parameters (weight, blood pressure, blood sugar, cholesterol) for longitudinal progress monitoring
- **Consultations**: Schedule and attend nutritionist consultations with calendar integration
- **Product Ordering**: Purchase supplements and health foods with multi-courier delivery tracking
- **Issue Resolution**: Report and track issues/complaints with nutritionist responses

### BR-2: Franchise Operations
The platform must enable independent franchise operations:
- Each franchise operates as an isolated tenant with its own members, nutritionists, products, and financial configuration
- Franchise-specific tax identifiers (PAN, TAN, GST number) and financial year configuration
- Per-franchise invoice sequencing (e.g., `GST/INV/EFMUM/INR/202503/000001`)
- Franchise-specific payment gateway configuration (Razorpay for India, Telr for UAE, Stripe for international)
- Multi-location support with address, contact, and operating hours per location
- Franchise-level reporting: member counts, revenue, program enrollment, product sales

### BR-3: Multi-Currency & Multi-Jurisdiction Payments
The platform must handle payments across geographies:
- **Currencies**: INR, AED, USD (extensible)
- **Payment Gateways**: Razorpay (India), Stripe (International), Telr (UAE/Gulf)
- **Tax Engines**: GST with IGST/CGST+SGST logic (India), VAT (UAE), Sales Tax (US)
- **Tax Calculation**: Computed at payment time based on member location, franchise jurisdiction, and applicable tax rules with effective dates
- **Promo Codes**: Percentage or fixed-amount discounts with validity windows, usage limits, and minimum order thresholds
- **Invoice Generation**: PDF invoices with tax breakdowns, generated via templates, sequentially numbered per franchise per financial year

### BR-4: Diet Plan & Recipe Management
The platform must support structured nutrition planning:
- **Diet Templates**: Reusable templates structured by cycles (e.g., 4-week programs) with daily meal variations
- **Personalization**: Nutritionists customize templates per member based on assessment data, food preferences, and health goals
- **Recipe Database**: Categorized recipes with ingredients, preparation methods, serving sizes, and full nutritional values (calories, macros, vitamins, minerals)
- **Recipe Organization**: By category (breakfast/lunch/dinner/snack), cuisine (Indian/Continental/etc.), and type (veg/non-veg/vegan)
- **PDF Generation**: Diet plans and recipes rendered as downloadable PDFs for offline use

### BR-5: Product Fulfillment & Delivery
The platform must support physical product sales:
- **Product Catalog**: Products with variants (size/weight), pricing per currency, HSN codes for tax classification
- **Multi-Courier Integration**: Parallel rate quotes from Nimbus Post, Shiprocket, and Shipway
- **Pincode Serviceability**: Check delivery availability by postal code with cached results
- **Shipment Lifecycle**: Draft → Rate Requested → Booked → Pickup → In Transit → Delivered (with RTO handling)
- **Real-Time Tracking**: Webhook-based status updates from courier providers

### BR-6: Communication & Notifications
The platform must support multi-channel member communication:
- **Email**: HTML templates for welcome, invoices, diet plans, consultation bookings, password resets (11 template types)
- **WhatsApp**: Pre-approved Meta templates for plans, payments, calls, orders (8 template types)
- **Notification Logging**: Track send status (pending/sent/failed) with full payload storage and retry capability

### BR-7: Content & Engagement
The platform must provide content to drive member engagement:
- **Blog System**: Articles with authors, categories, tags, images, comments with admin responses, and email distribution to subscribers
- **Success Stories**: Member transformation stories with before/after imagery and progress metrics
- **Testimonials**: Member reviews with rating system and approval workflow, categorized into two types: **Program Testimonials** (feedback on coaching/diet programs) and **Product Testimonials** (feedback on purchased products)
- **Pocket Guides**: Downloadable educational PDFs personalized with member names
- **FAQ**: Program-specific frequently asked questions

### BR-8: Admin & Role-Based Access Control (RBAC)
The platform must support granular, role-based access control with franchise-scoped isolation. Each admin user can be assigned one or more roles, and can be mapped to one or more franchises.

#### 8.1 Roles & Permissions Matrix

**Role 1: Super Admin** (`super_admin`)
- Full unrestricted access to all modules, screens, data, and configuration across all franchises
- User management: create/manage all admin users and assign roles
- System-wide master data management (LOVs, tax rules, payment gateway config)
- Cross-franchise reporting and analytics

**Role 2: Franchise Admin** (`franchise_admin`)
- Full access to all data and operations scoped to their assigned franchise(s)
- Member management: full lifecycle management for members under their franchise
- Staff management: create/manage nutritionists and other admin users within franchise scope
- Franchise configuration: update franchise details, payment gateway settings, tax identifiers
- View franchise-level reports: member analytics, revenue, program enrollment, product sales
- Program and plan management within franchise scope
- Product and order management within franchise scope
- Promo code management within franchise scope

**Role 3: Nutritionist** (`nutritionist`)
- Each nutritionist is mapped to one or more franchises via `txn_admin_franchises`
- Can only access members belonging to their mapped franchise(s)
- **Full access**: Members (manage), Diet Plans (manage), Assessments (manage), Health Issues (manage), Pocket Guides (manage), Recipes (manage), Call Logs (manage), Google Calendar (manage), Member Issues (manage)
- **Read-only access**: Programs, Program Categories, Program Plans, Diet Templates, LOV Master
- **No access**: Payments, Tax Management, Financial Reports, Product Delivery, Content Management (blogs, banners, SEO pages, testimonials, success stories, press/media)

**Role 4: Social Media Manager** (`social_content_manager`)
- Manages all public-facing content that appears on the website and public APIs
- **Full access**: Blogs (articles, authors, categories, comments), Success Stories, Testimonials (both Program and Product categories), Press & Media (YouTube posts + Press releases), Banners, FAQs, SEO Pages, Referrers
- **Read-only access**: Dashboard, LOV Master
- **No access**: Members, Payments, Programs, Products, Shipping, Franchise config, Admin Users, Tax Management, Reports

**Role 5: Financial Manager** (`financial_manager`)
- Manages all financial operations, payment configuration, and financial reporting
- Supports external financial team and business owner for tax audits and CA reporting
- **Full access**: Plan Programs (manage), Plan Fees/Pricing (manage), Tax Master (manage), Payment Reports (manage), Product Reports (read), Promo Codes (manage)
- **Limited member access**: Can view member details and access the "Add Program Plan" tab to assign program plans to members — no access to diet, assessment, health, or other member tabs
- **Read-only access**: Dashboard, Products, LOV Master
- **No access**: Diet Plans, Assessments, Health Issues, Content Management, Shipping, Franchise config, Admin Users

**Role 6: Product Delivery Manager** (`product_delivery_manager`)
- Manages the entire product delivery lifecycle from order receipt to shipment completion
- **Full access**: Shipments (manage), Courier Providers (manage), Courier Accounts (manage), Warehouses (manage), Product Orders (manage)
- **Limited member access**: Can view member details with Product tab only — to check new product orders from website clients and manage the delivery cycle (place to shipping, update status, track delivery)
- **Read-only access**: Dashboard, Products (catalog), Product Reports, LOV Master
- **No access**: Payments, Programs, Diet Plans, Assessments, Content Management, Tax Management, Franchise config, Admin Users

**Role 7: Appointment Manager** (`appointment_manager`)  — *NEW ROLE*
- Handles incoming enquiries from the website and schedules appointments between prospective/existing members and nutritionists
- **Full access**: Appointment Management (new screen — see BR-10), Google Calendar (view all admin users' availability, book appointments)
- **Read-only access**: Dashboard, Members (basic info for scheduling context), Admin Users (view calendar availability)
- **No access**: Diet Plans, Assessments, Payments, Products, Shipping, Content Management, Tax Management, Programs, Franchise config

#### 8.2 Database-Driven Access Control (No Hardcoded Role Checks)

**Critical Requirement**: All role-permission mappings must be stored in the database — **zero hardcoded role checks in application code**. No `if (role === 'super_admin')` or switch-case blocks in CASL factory or anywhere else. The code must be role-agnostic; it reads permissions from DB and enforces them generically.

**Database Schema for RBAC:**

| Table | Purpose |
|-------|---------|
| `mst_admin_roles` | Role definitions (role_id, role, role_code, active) — already exists |
| `mst_admin_subjects` | **NEW** — All protectable resources/subjects (subject_id, subject_code, subject_name, active). E.g., `Member`, `DietPlan`, `Blog`, `Payment`, `Shipment`, `Appointment`, etc. |
| `mst_admin_actions` | **NEW** — All possible actions (action_id, action_code, action_name). E.g., `manage`, `read`, `create`, `update`, `delete` |
| `mst_admin_role_subject_permissions` | **NEW** — The core permission matrix. Maps role → subject → allowed actions. Columns: `permission_id`, `role_id` (FK), `subject_id` (FK), `action_id` (FK), `franchise_scoped` (boolean — whether this permission is filtered by franchise), `active`, audit fields |
| `mst_admin_role_permissions` | Existing junction: maps admin_user → role(s) |
| `txn_admin_franchises` | Existing junction: maps admin_user → franchise(s) |

**How it works at runtime:**
1. On login/JWT validation, the system loads the user's assigned roles from `mst_admin_role_permissions`
2. For all assigned roles, it loads the permission rows from `mst_admin_role_subject_permissions` (role → subject → action → franchise_scoped)
3. The CASL `AbilityBuilder` dynamically constructs abilities from these DB rows — no role-specific logic in code
4. If `franchise_scoped = true` for a permission row, the CASL condition `{ franchiseId: { $in: user.franchiseIds } }` is applied automatically
5. The `AbilitiesGuard` + `@RequireAbility(action, subject)` decorator continue to work as-is — they are already role-agnostic

**Admin UI for Permission Management:**
- Super Admin can view and edit the permission matrix from the admin CMS
- UI shows a grid/matrix: Roles (rows) x Subjects (columns) with checkboxes per action (read/create/update/delete/manage)
- Changes take effect on next login (or token refresh) — no server restart required
- Adding a new role or new subject does not require any code deployment — just insert DB rows and configure permissions via the admin UI

**Seeding:**
- Initial role-subject-action permission mappings are seeded via SQL migration scripts (matching the permission matrix defined in Section 8.1 above)
- After initial seeding, all changes are managed through the admin UI

#### 8.3 General Access Control Rules
- **Franchise isolation**: Non-SuperAdmin roles see only data belonging to their assigned franchise(s), enforced via the `franchise_scoped` flag on each permission row
- **Multi-franchise mapping**: Admin users can be mapped to multiple franchises via `txn_admin_franchises` junction table
- **Multi-role assignment**: A single admin user can hold multiple roles simultaneously; effective permissions are the union of all assigned role permissions
- **Audit trail**: All data changes tracked with `created_by`, `modified_by`, timestamps, and IP addresses
- **Admin-side menu filtering**: The Angular admin CMS must dynamically show/hide sidebar menu items based on the logged-in user's effective permissions (loaded from DB, not hardcoded per role)
- **API response includes permissions**: The login/session API returns the user's effective permission list so the frontend can render UI accordingly without extra API calls

### BR-9: Reporting & Analytics
The platform must provide operational visibility:
- **Member Reports**: Total, active, by program, by franchise, by location
- **Revenue Reports**: By franchise, by plan type, by payment gateway, by period
- **Program Reports**: Enrollment rates, completion rates, plan distribution
- **Product Reports**: Sales volume, shipment status, delivery success rate
- **Export**: CSV export capability for all report types

### BR-10: Appointment Management — *NEW FEATURE*
The platform must support appointment scheduling for member consultations and new enquiries:
- **Enquiry intake**: When a new enquiry comes in from the website (contact form), an Appointment Manager can view the enquiry and initiate appointment booking
- **Calendar availability**: The Appointment Manager can view the Google Calendar availability of **nutritionists only**, scoped to their assigned franchise(s). Only nutritionists with an active Google Calendar connection are shown. If a nutritionist has not connected their Google Calendar, the system prompts the Appointment Manager to request that nutritionist to connect their Google Calendar before appointments can be booked with them
- **Appointment booking**: Book an appointment with a specific admin user based on their availability, linking it to the enquiry/member
- **Appointment CRUD**: Create, view, update, and cancel appointments with status tracking (Scheduled, Confirmed, Completed, Cancelled, No-Show)
- **Notifications**: Send appointment confirmation and reminder notifications to both the member/enquirer and the assigned admin user via email and WhatsApp
- **Calendar sync (two-way)**: All booked appointments are synced to the assigned admin user's Google Calendar. When an appointment is cancelled or rescheduled from the admin panel, the corresponding Google Calendar event must also be cancelled/updated automatically. The `google_event_id` is stored on the appointment record for sync operations
- **Appointment history**: Track all past and upcoming appointments per member and per admin user
- **Dashboard widget**: Show upcoming appointments count and next appointment details on the admin dashboard

---

## 6. Business Rules

| Rule | Description |
|------|-------------|
| **Tax at Payment** | Tax is always calculated and stored at the time of payment, never re-calculated at invoice or PDF rendering time |
| **Invoice Sequencing** | Invoice numbers are sequential per franchise, per invoice type (PRODUCT/SERVICE), per financial year — no gaps allowed |
| **Gateway Selection** | Payment gateway is auto-selected based on member country and franchise configuration — not user-chosen |
| **Franchise Isolation** | Members, payments, products, and reports are always scoped to the franchise context — no cross-franchise data leakage |
| **Assessment Before Plan** | Members must complete a health assessment before being assigned a diet plan |
| **Diet Plan Linked to Payment** | A diet plan is created only after successful payment for a program plan |
| **Promo Code Validation** | Promo codes are validated for: active status, date validity, usage limits, minimum order amount, and applicable programs |
| **Courier Serviceability** | Delivery orders are only accepted for pincodes confirmed serviceable by at least one courier provider |

---

## 7. Non-Functional Requirements

| Requirement | Specification |
|-------------|---------------|
| **Availability** | Platform must be accessible 24/7 with minimal downtime for members |
| **Security** | JWT + HttpOnly Secure cookies for auth; bcrypt password hashing; AES-256-CBC encryption for sensitive data; rate limiting (100 req/min); Helmet security headers |
| **Compliance** | GST-compliant invoicing (India); VAT-compliant (UAE); PCI-DSS compliance via payment gateway delegation |
| **Performance** | API response times under 500ms for standard CRUD; database connection pool (max 5) with 60s query timeout |
| **Monitoring** | Sentry error tracking on public API; Prometheus metrics endpoint for infrastructure monitoring |
| **Scalability** | Multi-tenant architecture supports adding franchises without infrastructure changes |
| **Data Integrity** | Sequelize transactions for multi-table operations; retry logic (3 attempts) for database connections |

---

## 8. Success Metrics

| Metric | Target |
|--------|--------|
| Member enrollment rate | Track monthly signups per franchise |
| Program completion rate | Percentage of members completing full program cycles |
| Diet plan adherence | Frequency of member health parameter logging |
| Payment success rate | Percentage of successful payment transactions vs. failures |
| Product delivery success | Percentage of orders delivered vs. RTO |
| Member retention | Re-enrollment rate after first program completion |
| Nutritionist efficiency | Members managed per nutritionist, consultations per week |

---

## 9. Assumptions & Constraints

### Assumptions
- Franchise owners have their own nutritionist staff who will use the admin portal
- Members have access to smartphones/computers for portal access and WhatsApp communication
- Payment gateways (Razorpay, Stripe, Telr) will continue to provide stable APIs
- Courier providers (Nimbus, Shiprocket, Shipway) support webhook-based tracking updates
- Google Calendar API remains available for consultation scheduling

### Constraints
- The platform must support Node.js 22+ runtime environment
- PostgreSQL is the only supported database engine
- Redis is required for caching (labels, payment gateways, countries)
- File storage is filesystem-based (not cloud object storage)
- SMS integration is not yet implemented (email and WhatsApp only)

---

## 10. Out of Scope (v2)

- Mobile native applications (iOS/Android) — members use the web platform
- Video calling integration — consultations are phone-based with calendar scheduling
- AI-powered diet plan generation — plans are manually created by nutritionists
- Multi-language/i18n support — platform operates in English
- Real-time chat between members and nutritionists
- Integration with fitness wearables (Fitbit, Apple Watch, etc.)
- Automated member-facing dashboards with charts/graphs
