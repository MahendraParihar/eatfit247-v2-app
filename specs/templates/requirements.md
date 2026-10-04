# Requirements: <Feature Name>

| Field | Value |
|-------|-------|
| Status | Draft → Approved → In Progress → Shipped |
| Branch | `feature/<slug>` |
| Roadmap | Phase N: <item> |
| References | BR-x, PRD §y story z, `specs/backlog/<file>` |
| Apps touched | server_1 / eatfit247-admin / eatfit247-web-1 / shared-library / db_changes |

## Context

Why this feature, why now, and for whom. Give the context the agent can't get from the code: business reasons, client requests, edge cases from real operations.

## User Stories

- As a **<role>**, I want **<capability>**, so that **<outcome>**.

## Scope

**In scope**
-

**Out of scope**
-

## Decisions

Key choices made during the spec interview, with a short reason for each. Record decisions, not low-level details the agent can work out (variable names, CSS classes).

| # | Decision | Why |
|---|----------|-----|
| 1 | | |

## Technical Constraints

Only what matters. Each item must conform to [tech-stack.md](../../product/tech-stack.md).

- **Data:** new/changed tables (`mst_`/`txn_`), migration `db_changes/NNN_*.sql`, soft delete, audit columns
- **Contract:** shared-library interfaces/enums
- **API:** endpoints, app (public/admin), `IResponse<T>`
- **RBAC:** subjects, actions per role, `franchise_scoped`
- **Money:** tax / invoice / payment impact (tax at payment, no sequence gaps)
- **Async:** events, cron, webhooks, notifications, idempotency

## Principle Check

Confirm against [mission.md § Product Principles](../../product/mission.md#product-principles). Note and justify any exception.

## Open Questions

- [ ]
