# Product Requirements Document (PRD)

# Database-Driven RBAC & Appointment Management

**Version:** 1.1
**Date:** 2026-05-09
**Last Updated:** 2026-05-09
**Status:** Ready for Development
**BRD Reference:** BR-8 (RBAC), BR-10 (Appointment Management)
**Changelog:** v1.1 — Added security findings from test review, expanded test coverage (120+ tests), appointment validation rules

---

## 1. Problem Statement

The current RBAC system hardcodes all role-permission mappings inside `casl-ability.factory.ts`. Each role (SuperAdmin, FranchiseAdmin, Nutritionist, BlogAdmin, SocialContentManager, ProductUser, AccountUser) has its own method with explicit ability grants. This creates three problems:

1. **Adding or modifying a role requires code changes and redeployment.** The business cannot adjust permissions without developer involvement.
2. **Role definitions drift from business intent.** Permission changes require reading TypeScript code to understand what a role can actually do — there is no admin-visible permission matrix.
3. **New business roles are missing.** The platform needs a Financial Manager (expanded from the read-only AccountUser), a Product Delivery Manager (refined from ProductUser), and an entirely new Appointment Manager role with a new appointment scheduling feature. These cannot be added without significant code changes under the current architecture.

Additionally, the platform lacks an appointment management system. Website enquiries (contact form submissions) have no workflow for scheduling consultations with nutritionists. The Appointment Manager role needs a new screen to view nutritionist calendar availability and book appointments.

---

## 2. Solution

Migrate all role-permission logic from hardcoded TypeScript to database tables, and build a new Appointment Management module.

**For RBAC:**
- Three new database tables store subjects, actions, and the role-subject-action permission matrix
- The CASL ability factory becomes a generic loader — it reads permission rows from DB (via Redis cache) and builds abilities dynamically with zero role-specific logic
- Super Admin gets a permission matrix screen in the admin CMS to manage role permissions without code changes
- Roles are fully manageable via admin UI (create, rename, deactivate)
- Permission changes take effect immediately via Redis pub/sub cache invalidation

**For Appointment Management:**
- A new `appointment` NestJS module with its own model, controllers, services, and DTOs
- Appointment CRUD with status lifecycle (via LOV master), optional linking to contact form enquiries
- Two-way Google Calendar sync — create, update, and cancel calendar events
- 24-hour reminder notifications via NestJS cron job (email + WhatsApp)
- Franchise-scoped, nutritionists-only calendar availability view

---

## 3. User Stories

### RBAC — Super Admin
1. As a Super Admin, I want to view a permission matrix (subjects x actions grid) for any role, so that I can see exactly what each role is allowed to do.
2. As a Super Admin, I want to toggle individual permission checkboxes (read/create/update/delete) per subject per role, so that I can fine-tune access control without developer involvement.
3. As a Super Admin, I want a "Select All" option per row (all actions for a subject) and per column (one action for all subjects), so that I can bulk-assign permissions efficiently.
4. As a Super Admin, I want permission changes to take effect immediately (on the user's next API request), so that there is no stale access window after I update permissions.
5. As a Super Admin, I want to create a new role with a name and code, so that I can define new organizational roles as the business grows.
6. As a Super Admin, I want new roles to start with zero permissions, so that I must explicitly grant access before the role can do anything.
7. As a Super Admin, I want to rename an existing role (display name and code), so that role names reflect current business terminology.
8. As a Super Admin, I want to deactivate a role (soft delete), so that it stops appearing in role assignment dropdowns without losing historical data.
9. As a Super Admin, I want the system to automatically grant all permissions to Super Admin roles when a new subject is added via migration, so that Super Admin never silently loses access.
10. As a Super Admin, I want the subjects list to be read-only in the admin UI (managed by developers via migrations), so that phantom subjects without corresponding API protection cannot be created.

### RBAC — Login & Session
11. As any admin user, I want the login API to return my effective permissions as a dictionary (`{ "Member": ["read","create","update","delete"], ... }`), so that the frontend can render menus and tabs without extra API calls.
12. As any admin user, I want the login API to return my assigned roles with display name and code (`[{ roleId, role, roleCode }]`), so that the UI can show my role in the header/profile.
13. As an admin user with multiple roles, I want my effective permissions to be the union of all role permissions (additive only, no deny), so that each role expands my access rather than restricting it.
14. As an admin user, I want my permissions to be cached in Redis and invalidated instantly when a Super Admin changes them, so that I get fast API responses without stale permissions.

### RBAC — Franchise Scoping
15. As a franchise-scoped admin user, I want the system to automatically filter data by my assigned franchise(s) for franchise-scoped subjects, so that I never see data from other franchises.
16. As a franchise-scoped admin user mapped to multiple franchises, I want to see data from all my assigned franchises, so that I can work across locations without switching accounts.
17. As a Super Admin (mapped to all franchises), I want franchise scoping to effectively be unrestricted, so that I can access cross-franchise data for reporting.

### RBAC — Frontend Menu & Tab Visibility
18. As any admin user, I want sidebar menu items to be visible only if I have `read` permission on the corresponding subject, so that I don't see screens I cannot access.
19. As a Financial Manager viewing a member detail page, I want to see only the "Program Plan" tab (not Diet, Assessment, Health, etc.), so that I can assign program plans without seeing irrelevant member data.
20. As a Product Delivery Manager viewing a member detail page, I want to see only the "Product" tab, so that I can manage delivery without accessing health or payment data.
21. As a Nutritionist viewing a member detail page, I want to see Diet Plans, Assessments, Health Issues, Pocket Guides, Call Logs, Issues, and Recipes tabs but not Payment or Product tabs, so that I focus on coaching without financial distractions.

### RBAC — Role-Specific Access
22. As a Nutritionist, I want full access to member diet plans, assessments, health issues, pocket guides, recipes, call logs, and issues for members in my franchise(s), so that I can manage the complete coaching workflow.
23. As a Nutritionist, I want read-only access to programs, program categories, program plans, and diet templates, so that I can reference them while creating personalized plans.
24. As a Nutritionist, I want no access to payments, tax management, financial reports, product delivery, or content management, so that I stay focused on coaching.
25. As a Social Media Manager, I want full access to blogs, success stories, testimonials (both Program and Product categories), press & media (YouTube + press releases), banners, FAQs, SEO pages, and referrers, so that I can manage all public-facing content.
26. As a Social Media Manager, I want no access to members, payments, programs, products, shipping, or franchise configuration, so that I only see content-relevant screens.
27. As a Financial Manager, I want full access to program plans, plan fees/pricing, tax master, payment reports, and promo codes, so that I can manage all financial operations.
28. As a Financial Manager, I want limited member access — view member details with only the "Add Program Plan" tab — so that I can assign program plans to clients without accessing their health data.
29. As a Financial Manager, I want no access to diet plans, assessments, health issues, content management, shipping, or admin user management, so that I stay within my financial scope.
30. As a Product Delivery Manager, I want full access to shipments, courier providers, courier accounts, warehouses, and product orders, so that I can manage the entire delivery lifecycle.
31. As a Product Delivery Manager, I want limited member access — view member details with Product tab only — so that I can check new product orders and manage delivery.
32. As a Product Delivery Manager, I want no access to payments, programs, diet plans, assessments, content, or tax management, so that I focus on logistics.

### Appointment Management — Appointment Manager
33. As an Appointment Manager, I want to view a list of all appointments in my franchise(s) with filtering by status, date range, and nutritionist, so that I can manage the scheduling workload.
34. As an Appointment Manager, I want to create a new appointment by selecting a nutritionist, date, time slot, and appointment type, so that I can book consultations for enquiries or existing members.
35. As an Appointment Manager, I want to optionally link an appointment to a contact form submission, so that I can trace which website enquiry led to the appointment.
36. As an Appointment Manager, I want to optionally link an appointment to an existing member, so that I can book follow-up consultations for current clients.
37. As an Appointment Manager, I want to enter guest details (name, email, phone) for appointments with people who are not yet members, so that I can book for prospects without creating a member record first.
38. As an Appointment Manager, I want to view the Google Calendar availability of nutritionists in my franchise(s), so that I can find open time slots for booking.
39. As an Appointment Manager, I want to see only nutritionists who have connected their Google Calendar, so that I can check real availability.
40. As an Appointment Manager, I want to be informed when a nutritionist has not connected their Google Calendar, so that I can request them to connect it before booking.
41. As an Appointment Manager, I want to add internal notes to an appointment, so that the nutritionist has context before the consultation.
42. As an Appointment Manager, I want to update the status of an appointment (Scheduled, Confirmed, Completed, Cancelled, No-Show), so that I can track the appointment lifecycle.
43. As an Appointment Manager, I want to cancel an appointment with a reason, so that cancellations are documented.
44. As an Appointment Manager, I want cancelling an appointment to automatically delete the corresponding Google Calendar event, so that the nutritionist's calendar stays accurate.
45. As an Appointment Manager, I want rescheduling an appointment to automatically update the Google Calendar event, so that calendar sync is always two-way.
46. As an Appointment Manager, I want to view appointment history per member or per nutritionist, so that I can see past and upcoming consultations.

### Appointment Management — Notifications
47. As a guest/member with a booked appointment, I want to receive an email and WhatsApp confirmation with date, time, and nutritionist details, so that I know when my consultation is.
48. As a guest/member, I want to receive an email and WhatsApp reminder 24 hours before my appointment, so that I don't forget.
49. As a guest/member, I want to be notified via email and WhatsApp if my appointment is rescheduled, so that I have the updated details.
50. As a guest/member, I want to be notified via email and WhatsApp if my appointment is cancelled, so that I know it's no longer happening.
51. As a nutritionist, I want to receive a notification when a new appointment is booked with me, so that I'm aware of upcoming consultations.
52. As a nutritionist, I want to receive a notification when an appointment with me is rescheduled or cancelled, so that my schedule stays current.

### Appointment Management — Dashboard
53. As any admin user with dashboard access, I want to see upcoming appointment counts and next appointment details on the dashboard, so that I have a quick overview of scheduled consultations.

### Contact Form Integration
54. As an Appointment Manager, I want to view all contact form submissions (globally, not franchise-scoped), so that I can identify enquiries that need appointment scheduling.
55. As an Appointment Manager, I want to create an appointment directly from a contact form entry (pre-filling guest name, email, phone), so that the booking flow is seamless.

---

## 4. Implementation Decisions

### Database Schema — RBAC

**New tables:**

- `mst_admin_subjects` — all protectable resources (subject_id, subject_code, subject_name, franchise_scoped boolean, active). The `franchise_scoped` flag lives on the subject, not on the permission row. A subject is either franchise-scoped or global regardless of which role accesses it. Developer-managed via migrations only — not editable from admin UI.

- `mst_admin_actions` — the 4 discrete actions (action_id, action_code, action_name): `read`, `create`, `update`, `delete`. The `manage` action does NOT exist in the database. When all 4 actions are present for a role-subject pair, the CASL builder can internally optimize to `manage` for performance. Managed via migrations only.

- `mst_admin_role_subject_permissions` — the core permission matrix. Columns: permission_id, role_id (FK), subject_id (FK), action_id (FK), active, audit fields (created_by, modified_by, created_ip, modified_ip, created_at, updated_at). One row per role-subject-action combination. No `franchise_scoped` column here — scoping is derived from the subject.

**Modified tables:**

- `mst_admin_roles` — add `grant_all_on_new_subject` boolean column (default false). When true, the PostgreSQL trigger auto-inserts all 4 action permission rows for this role whenever a new subject is inserted into `mst_admin_subjects`. Used for Super Admin auto-grant.

- `mst_admin_role_permissions` — renamed to `txn_admin_user_roles`. Same columns (admin_role_permission_id → admin_user_role_id, admin_id, role_id, active, audit fields). Only the table name and PK column name change; FK relationships remain intact.

**PostgreSQL trigger:**

- `AFTER INSERT` trigger on `mst_admin_subjects` that auto-inserts rows into `mst_admin_role_subject_permissions` for every role where `grant_all_on_new_subject = true`. Inserts all 4 actions (read, create, update, delete) for the new subject.

**Application-level hook:**

- The NestJS service for subject management also inserts Super Admin permission rows in the same transaction, providing proper audit fields (created_by, created_ip) that the DB trigger cannot populate.

### Database Schema — Appointments

**New table:**

- `txn_appointments` — appointment_id (PK), contact_form_id (FK nullable to txn_contact_forms), member_id (FK nullable to txn_members), assigned_admin_id (FK to mst_admin_users — the nutritionist), booked_by_admin_id (FK to mst_admin_users — the Appointment Manager), franchise_id (FK to mst_franchises), appointment_date (DATE), start_time (TIME), end_time (TIME), status (INT, FK to mst_lovs), appointment_type (INT, FK to mst_lovs), guest_name (VARCHAR 100 nullable), guest_email (VARCHAR 100 nullable), guest_phone (VARCHAR 25 nullable), notes (TEXT nullable), cancellation_reason (VARCHAR 500 nullable), google_event_id (VARCHAR 255 nullable), reminder_sent (BOOLEAN default false), active (BOOLEAN), audit fields.

**LOV master entries:**

- Appointment Status category: Scheduled, Confirmed, Completed, Cancelled, No-Show
- Appointment Type category: New Enquiry, Follow-up, Consultation, Assessment Review

### CASL Ability Factory Rewrite

- Remove all role-specific methods (`applyFranchiseAdmin`, `applyNutritionist`, `applyBlogAdmin`, `applySocialContentManager`, `applyProductUser`, `applyAccountUser`)
- Remove `AdminRoleEnum` import and all role-code comparisons
- New logic: receive permission rows (from Redis cache or DB fallback), iterate through each row, call `can(action, subject)` or `can(action, subject, { franchiseId: { $in: franchiseIds } })` based on the subject's `franchise_scoped` flag
- The factory becomes ~30 lines of generic code instead of ~200 lines of role-specific code

### Redis Permission Cache

- On login or JWT validation, check Redis for key `permissions:{adminId}`
- Cache miss: query DB (join `txn_admin_user_roles` → `mst_admin_role_subject_permissions` → `mst_admin_subjects` → `mst_admin_actions`), build permission set, store in Redis with TTL matching JWT access token expiry (15 minutes)
- On permission change via admin UI: publish Redis pub/sub event `permissions:invalidate` with affected admin IDs. All API instances subscribe to this channel and delete the relevant cache keys. Affected users get fresh permissions on their next request.
- Cache value structure: JSON with `roles` array and `permissions` dictionary, plus `franchiseIds` and subject franchise_scoped metadata

### Login/Session API Response

- Add `roles: [{ roleId, role, roleCode }]` — for display in UI header
- Add `permissions: { "Member": ["read","create","update","delete"], "Blog": ["read"], ... }` — dictionary format for frontend access control
- Keep `franchiseIds` — still needed for frontend franchise selector
- Remove `roleKeys` — replaced by `roles` array

### Shared Library Changes

- Remove `AdminRoleEnum` entirely — roles are DB entities, no code references role codes
- Keep `AdminSubjectEnum` — used by `@RequireAbility` decorators for compile-time type safety
- Keep `AdminActionEnum` — remove `Manage` value, keep `Read`, `Create`, `Update`, `Delete`
- Add `Appointment` to `AdminSubjectEnum`
- Update `IAuthUser` interface to include `roles` and `permissions` fields

### Role Changes (Migration)

- Rename `account_user` → `financial_manager` (in-place UPDATE on role_code and role columns)
- Rename `product_user` → `product_delivery_manager` (in-place UPDATE)
- Delete `blog_admin` role — reassign all users with BlogAdmin to SocialContentManager, then DELETE the role row
- Insert new `appointment_manager` role
- Set `grant_all_on_new_subject = true` for the Super Admin role

### Appointment Module Architecture

- Separate NestJS module: `AppointmentModule` in `libs/modules/appointment/`
- Standard structure: controllers/admin/, services/, models/, dto/
- Register `TxnAppointment` model in modelRegistry
- Controllers protected with `@RequireAbility(action, AdminSubjectEnum.Appointment)`
- Google Calendar operations (create event, update event, delete event) delegated to existing `GoogleService` in platform lib
- Availability endpoint: query `mst_admin_users` filtered by franchise_id + role = nutritionist + google_refresh_token IS NOT NULL, then call Google Calendar FreeBusy API for selected nutritionist
- Appointment CRUD: standard list/create/update/detail endpoints
- Status changes trigger Google Calendar sync (cancel → delete event, reschedule → update event)

### Appointment Reminder Cron

- NestJS `@Cron('0 * * * *')` — runs hourly
- Query: `SELECT * FROM txn_appointments WHERE appointment_date = CURRENT_DATE + 1 AND reminder_sent = false AND status IN (Scheduled, Confirmed)`
- For each match: send email + WhatsApp notification, set `reminder_sent = true`
- Follows existing `ShipmentRetryCron` pattern

### Contact Form Integration

- Contact forms remain global (no franchise_id column added)
- Appointment Manager can view all contact forms regardless of franchise
- When creating an appointment from a contact form, the appointment inherits franchise_id from the selected nutritionist's franchise
- `contact_form_id` on `txn_appointments` is a nullable FK for traceability

### Frontend Changes

- Sidebar menu: replace role-based visibility checks with permission-based checks. Each menu item maps to a subject; visible if user has `read` on that subject.
- Member detail tabs: each tab maps to an existing subject (DietPlan, Assessment, Payment, Product, etc.); visible if user has `read` on that subject.
- New screens: Permission Matrix (grid with role dropdown, subjects x actions checkboxes, Select All), Role Management (CRUD table), Appointment Management (list, create/edit dialog, nutritionist calendar view)
- Login response handler: store `permissions` dictionary and `roles` array in app state for access checks

### Multi-Role Permission Resolution

- Permissions are additive only — no deny rules
- Effective permissions = union of all assigned role permissions
- Example: Nutritionist grants `Member: [read,create,update,delete]`, Appointment Manager grants `Member: [read]` → effective `Member: [read,create,update,delete]`
- CASL builder iterates all permission rows across all user roles and calls `can()` for each — duplicates are harmless (CASL handles additive rules natively)

### Appointment Validation Rules (from test review)

The appointment service must enforce these validations during creation:
- **Nutritionist must be active** — reject if `active: false`
- **Nutritionist must have Google Calendar connected** — reject if `googleRefreshToken` is null
- **Nutritionist must be in the booker's franchise** — reject if franchise mismatch
- **Appointment date cannot be in the past** — reject past dates
- **Start time must be before end time** — reject invalid time ranges
- **No overlapping appointments** — check for existing appointments with same nutritionist, same date, overlapping time slot
- **Contact form must exist if contactFormId is provided** — throw NotFoundException
- **Member must exist if memberId is provided** — throw NotFoundException
- **Google Calendar event creation must succeed** — if `bookSlot` fails, do not create the appointment (rollback)

During status updates:
- **Cancellation requires a reason** — reject if `cancellationReason` is empty
- **Google Calendar failures are non-blocking** — if `cancelSlot` or `updateSlot` fails during status change or reschedule, still update the DB record (log the error)
- **Reschedule blocked for terminal statuses** — cannot reschedule Cancelled or Completed appointments
- **Soft delete cancels calendar event** — if appointment has `googleEventId`, cancel the calendar event before soft-deleting

### Security Findings (from test review — MUST FIX in production)

Three security-critical issues were identified during test coverage review. These must be addressed in the production implementation:

**1. CASL franchise scope not verified with subject instances**
- Current CASL usage: `ability.can(action, 'SubjectString')` — this ignores conditions entirely
- Correct CASL usage: `ability.can(action, subject('Member', { franchiseId: resourceFranchiseId }))` — this evaluates the `{ franchiseId: { $in: franchiseIds } }` condition
- Impact: Without subject instances, franchise scoping is not enforced at the CASL level. Services must pass subject instances (or the guard must inject the resource's franchiseId) when checking permissions for franchise-scoped subjects
- Fix: The `AbilitiesGuard` or individual services must construct subject instances with the resource's `franchiseId` for all franchise-scoped subjects

**2. Super Admin with empty franchiseIds blocked from franchise-scoped operations**
- Super Admin has `franchiseIds: []` (no explicit franchise assignments). Multiple places use `franchiseIds.includes(x)` or `Set.has(x)` which returns false for empty arrays
- Impact: Super Admin is incorrectly blocked from franchise-scoped operations (creating appointments, viewing nutritionists, etc.)
- Fix: Treat empty `franchiseIds` as "all franchises" for roles with `grant_all_on_new_subject = true`. Add an `isSuperAdmin` check (based on the role flag, not the role name) to bypass franchise filtering

**3. findAll franchise leakage in appointment service**
- User can pass an explicit `franchiseId` filter parameter that is not validated against their `franchiseIds`
- Impact: A user in franchise 1 could query appointments from franchise 2 by passing `franchiseId: 2`
- Fix: Always intersect the requested `franchiseId` filter with the user's `franchiseIds`. If the requested franchise is not in the user's list, ignore it and use the user's franchises

---

## 5. Testing Decisions

### Testing Philosophy
- Test external behavior, not implementation details. Tests verify inputs/outputs and state changes, not internal method calls or data structures.
- Focus on modules where bugs have the highest blast radius — permission resolution errors could grant unauthorized access or lock out legitimate users.

### Test Coverage Summary (120+ tests written)

**Core RBAC (4 test files, ~61 tests):**

| File | Tests | Key Coverage |
|------|-------|-------------|
| `casl-ability.factory.spec.ts` | 19 | Franchise scope with subject instances (security-critical), multi-role union, empty permissions, inactive row filtering, mixed scoped/unscoped subjects |
| `rbac-cache.service.spec.ts` | 12 | Cache hit/miss, corrupted JSON fallback, pub/sub invalidation, rebuild failure propagation, concurrent invalidation, TTL verification |
| `permission-resolution.service.spec.ts` | 19 | Single/multi-role resolution, grant_all_on_new_subject, inactive roles/permissions/subjects filtering, null relations, AdminSubjectEnum.All exclusion, sorted actions |
| `abilities.guard.spec.ts` | 11 | Permission enforcement, no decorator passthrough, no user rejection, partial user object, Manage action passthrough, decorator precedence |

**Appointment Module (3 test files, ~64 tests):**

| File | Tests | Key Coverage |
|------|-------|-------------|
| `appointment.service.spec.ts` | 32 | CRUD, contact form/member linking, guest fields, role validation, franchise scope, Google Calendar create/cancel/update sync, status transitions (valid+invalid), overlapping bookings, past dates, time validation, franchise leakage prevention, Super Admin bypass, calendar failure handling, soft delete with calendar cleanup |
| `appointment-availability.service.spec.ts` | 15 | Franchise-scoped nutritionist filtering, Google Calendar connection requirement, free/busy slots, multi-franchise access, inactive/null-franchise exclusion, API error handling, Super Admin bug documentation |
| `appointment-reminder.cron.spec.ts` | 17 | Tomorrow query, status filtering, guest/member recipient resolution, email+WhatsApp send, reminder_sent flag management, failure continuation, nutritionist name resolution, idempotency keys, batch processing, no-contact-info skip, null member/nutritionist handling |

### Testing Philosophy
- Test external behavior, not implementation details. Tests verify inputs/outputs and state changes, not internal method calls or data structures.
- Focus on modules where bugs have the highest blast radius — permission resolution errors could grant unauthorized access or lock out legitimate users.
- Security-critical tests use CASL `subject()` helper to verify franchise scoping with actual subject instances, not just string-based checks.

### Test Infrastructure
- Jest with `ts-jest`, `@nestjs/testing` for module integration tests
- Run with `npx nx test core` (RBAC) or `npx nx test appointment` or `npm run test` (all)
- Mock factories for typed test data — no `any` type used
- Tests currently validate the behavioral contract (spec-first approach). When production services are implemented, tests must be rewired to test the real classes instead of in-file stubs.

### What Makes a Good Test
- Tests the contract (API input → expected output), not the implementation
- Covers the happy path, edge cases (empty permissions, all permissions, multi-role overlap), and error cases (invalid role, missing subject, cache failure fallback)
- Does not mock the permission resolution logic itself — mocks only external dependencies (Redis, database)
- Each test is independent and does not rely on execution order

---

## 6. Out of Scope

- **Dynamic permission rules with conditions beyond franchise scoping** — no field-level permissions, no time-based access rules, no IP-based restrictions
- **Permission deny/exclude rules** — permissions are additive only; restricting a specific permission granted by another role is not supported
- **Subjects manageable via admin UI** — subjects remain developer-managed via migrations to prevent phantom permissions
- **Appointment self-service booking by members** — appointments are booked by the Appointment Manager, not by members/guests directly from the website
- **Recurring appointments** — each appointment is a standalone booking; no recurring schedule support
- **Google Calendar webhook for external changes** — the system pushes to Google Calendar but does not listen for changes made directly in Google Calendar by the nutritionist
- **Video/Zoom integration for appointments** — consultations remain phone-based
- **Contact form franchise assignment** — contact forms stay global; franchise scoping starts at the appointment level
- **Audit log screen for permission changes** — permission changes are tracked via audit fields (created_by, modified_by) but there is no dedicated change-log viewer in this phase

---

## 7. Further Notes

### Migration Order
The DB migration must execute in this order:
1. Create `mst_admin_subjects` and `mst_admin_actions` tables, seed initial data
2. Add `grant_all_on_new_subject` column to `mst_admin_roles`
3. Create `mst_admin_role_subject_permissions` table
4. Create PostgreSQL trigger on `mst_admin_subjects`
5. Rename `mst_admin_role_permissions` → `txn_admin_user_roles`
6. Rename roles (account_user → financial_manager, product_user → product_delivery_manager)
7. Delete BlogAdmin role (reassign users first)
8. Insert appointment_manager role
9. Seed initial permission matrix for all roles (matching BRD Section 8.1)
10. Create `txn_appointments` table
11. Seed LOV master entries for appointment status and type

### Backward Compatibility
- The `@RequireAbility` decorator and `AbilitiesGuard` interface remain unchanged — controllers do not need modification
- The CASL ability factory's public interface (`createForUser`) stays the same — only internal implementation changes
- Frontend must be updated to use `permissions` dictionary instead of `roleKeys` for access checks — this is a breaking change in the login response shape that requires coordinated frontend + backend deployment

### Performance Expectations
- Permission cache hit: ~1ms (Redis GET)
- Permission cache miss (DB query + cache write): ~50-100ms (one-time per login or cache invalidation)
- Cache invalidation propagation: <100ms (Redis pub/sub)
- Appointment list query: <200ms (standard paginated query with franchise scope)
