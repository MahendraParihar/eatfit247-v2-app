# Plan: <Feature Name>

> Source: [requirements.md](./requirements.md) · Done when: [validation.md](./validation.md) passes
>
> Work in numbered task groups. Each group should be a reviewable, committable step. For risky areas (payments, tax/invoices, RBAC, migrations), implement **one group at a time** and commit between groups.
> If review finds a gap, add a new group here rather than patching silently.

## Group 1: Database

- [ ] 1.1 Migration `db_changes/NNN_<description>.sql` (+ seed / backfill)

## Group 2: Shared Library

- [ ] 2.1 Interfaces / enums, then `cd shared-library && npm run build`

## Group 3: Backend (`server_1`)

- [ ] 3.1 Model + repository
- [ ] 3.2 Service + unit tests
- [ ] 3.3 Controller + `@RequireAbility`

## Group 4: Admin CMS (`eatfit247-admin`)

- [ ] 4.1 API service + routes
- [ ] 4.2 Components (`.ts` / `.html` / `.scss`, Material, tokens)

## Group 5: Public Website (`eatfit247-web-1`)

- [ ] 5.1

## Group 6: Close-out

- [ ] 6.1 All checks in `validation.md` pass
- [ ] 6.2 `requirements.md` status → Shipped; roadmap item → ✅ with a link
- [ ] 6.3 Any constitution change (mission / tech-stack) noted for the replanning step
