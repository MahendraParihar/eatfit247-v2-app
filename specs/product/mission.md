# Product Mission

> Last updated: 2026-10-04 (constitution interview) · Sources: owner interview, [docs/BRD.md](../../docs/BRD.md), [docs/PRD.md](../../docs/PRD.md), [docs/PRD-RBAC-Appointment.md](../../docs/PRD-RBAC-Appointment.md)

## Pitch

EatFit247 is a health and nutrition coaching business that runs on a global franchise model. This platform (v2, live in production) runs the whole operation from one system:

- an **admin CMS** where EatFit247's team coaches members and runs operations
- a **public website** that drives growth
- **franchise support**, so partner owners in other countries can sell EatFit247 programs while EatFit247's nutritionists deliver the coaching

## Business Model

```
                    ┌──────────────────────────────┐
                    │  EatFit247 (master franchise)│
                    │  India · nutritionists · IP  │
                    └──────────────┬───────────────┘
        per-customer fee ▲         │ nutritionists serve
        from partner     │         ▼ partner customers
          ┌──────────────┴───────────────────────┐
          │ Partner franchise (e.g. Dubai)        │
          │ different owner · registers customers │
          │ from outside India · collects payment │
          └───────────────────────────────────────┘
```

- **EatFit247 is the primary franchise.** It serves Indian customers directly and employs the nutritionists.
- **Partner franchises** (Dubai today, more countries over time) are run by independent owners. Customers outside India register under a partner franchise, and the partner collects their payment (offline today, recorded in v2).
- **Nutritionists are shared.** EatFit247's nutritionists are mapped to several franchises, so they can coach partner customers. A partner may add its own nutritionists later.
- **The partner pays EatFit247 per customer.** Today this settlement is tracked outside v2. It is planned to move into the platform.
- **Super Admin registers new franchises.** The same model repeats for each new country.

## Problem

- Coaching used to run on Excel and WhatsApp, so quality depended on the individual coach and there was no central member history.
- Tax compliance (GST, export of service, and later VAT) and gap-free invoice numbering are audit-critical and error-prone when done by hand.
- A franchise model needs strict data isolation per owner, but nutritionists must still work across franchises.
- Settlement between EatFit247 and partner franchises is manual (Excel).

## Users

| User | App | What they need |
|------|-----|----------------|
| **EatFit247 internal team**: nutritionists, finance, delivery, content, appointments | Admin CMS | Fast, accurate daily operations: member coaching, diet plans, invoices, shipments, content |
| **Super Admin** (EatFit247) | Admin CMS | Register franchises, configure RBAC, oversee everything across franchises |
| **Partner franchise owner** (e.g. Dubai) | Admin CMS | Log in and see **only their franchise's** members, payments and reports |
| **Prospects / visitors** | Website | Discover programs, trust signals (stories, reviews, press), enquire or book, buy products |
| **Members** | Website (later), email, WhatsApp, PDF | Today: receive plans and updates through staff. Later: self-service portal |

### App purpose

- **`eatfit247-admin`** is the tool for internal operations. Optimise for staff speed, accuracy and correct data scoping.
- **`eatfit247-web-1`** is the tool for growth. Optimise for conversion, SEO, performance and trust.

## Markets

| Market | Franchise | Payments today | Tax |
|--------|-----------|----------------|-----|
| India | EatFit247 | **Online through Razorpay (live)** | GST (IGST / CGST+SGST) |
| Non-Indian customers of the Indian franchise | EatFit247 | Razorpay / offline | Export of service (non-GST invoice sequence) |
| UAE and other countries | Partner (Dubai) | **Offline, recorded manually in v2** | VAT / no tax by jurisdiction |

Telr (UAE) and Stripe (international) integrations exist in code but are **not live**. Going live with them is on the roadmap.

## Differentiators

1. **Franchise-native and shared-coach model.** Data is isolated per franchise owner, while EatFit247 nutritionists serve customers across franchises.
2. **Compliance by construction.** Tax is calculated at payment time, and invoices are numbered with no gaps per franchise, invoice type and financial year, with separate GST and non-GST sequences.
3. **One platform for coaching and commerce.** Programs, diet plans, recipes, products and courier delivery share one member record.
4. **Access is configuration, not code.** RBAC lives in the database. Super Admin can change roles and onboard franchises without a deployment.

## Product Principles

These are non-negotiable. Every feature spec must respect them or explicitly argue for an exception.

1. **Tax at payment.** Tax is computed and stored when the payment is recorded. Invoices and PDFs only render stored values.
2. **No invoice gaps.** Sequences are strictly sequential per franchise, invoice type and financial year (GST and non-GST are separate).
3. **Franchise isolation.** A franchise owner never sees another franchise's data. Every admin query is scoped, enforced in services *and* in the CASL ability check.
4. **Nutritionists cross franchises; data does not.** A nutritionist mapped to several franchises sees members of those franchises only.
5. **Permissions live in data.** Never write `if (role === …)`. Access comes from `mst_admin_role_subject_permissions`.
6. **Soft delete only.** Use `active = false` and never physically delete.
7. **Ordered journey.** Assessment comes before the plan, and payment comes before the diet plan. Both are enforced on the server.
8. **One contract.** Shapes shared by the frontend and backend live in `shared-library`.
9. **Automated proof.** Every feature should ship with automated backend integration and end-to-end tests. Manual checks are a stopgap (see `tech-stack.md § Testing`).

## Success Metrics

| Metric | Signal |
|--------|--------|
| Enquiry → enrolment | Website enquiries and bookings converting to paid programs |
| Member enrolment | Monthly signups per franchise |
| Program completion and retention | % of members completing cycles; re-enrolment after the first program |
| Staff efficiency | Members per nutritionist, consultations per week, time to issue a plan |
| Invoice integrity | Zero sequence gaps or corrections per financial year |
| Franchise growth | Number of active partner franchises and customers per partner |
| Delivery success | Delivered vs. RTO |

## Non-Goals (v2)

Out of scope for v2: native mobile apps, video consultations, AI-generated diet plans, i18n (English only), real-time chat, wearable integrations, SMS, and members booking appointments themselves. The member self-service portal is **planned for a later phase**, not a non-goal (see [roadmap.md](./roadmap.md)).
