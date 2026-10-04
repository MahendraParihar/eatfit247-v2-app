# Tech Stack

> Last updated: 2026-10-04 (constitution interview) · Versions come from each project's `package.json`. Update this file whenever a major dependency changes.

## Monorepo Layout

| Project | Role | Stack | Dev port |
|---------|------|-------|----------|
| `shared-library` | Contract layer: interfaces, enums, utils | Pure TypeScript 5.x | — |
| `server_1` | Backend: `public-api` and `admin-api` | NestJS 11, NX 22 | 3000 / 3001 |
| `eatfit247-admin` | Internal admin CMS | Angular 20, NgModule SPA, NX 22 | 4200 |
| `eatfit247-web-1` | Public website | Angular 21, SSR, standalone, zoneless, NX 22 | 4200 |
| `infra` | Containers and reverse proxy | Docker Compose, Nginx | — |
| `db_changes` | Schema and data migrations | Numbered raw SQL files | — |

Build order: `shared-library`, then `server_1`, then the frontends. Every project imports shared types from `@eatfit247-shared-lib`.

## Runtime and Infrastructure

| Concern | Choice |
|---------|--------|
| Runtime | Node.js 22+ (`node:22`, `node:22-alpine` images) |
| Database | PostgreSQL (the only supported engine) |
| Cache / pub-sub | Redis (`ioredis` 5, `cache-manager` 6 + `cache-manager-redis-store`) |
| Containers | Docker Compose (`infra/docker-compose.yml`), multi-stage Dockerfiles per app |
| Reverse proxy / TLS | Nginx (`infra/nginx*.conf`, `infra/certs`) |
| Non-Docker process manager | PM2 (`ecosystem.config.js`) |
| File storage | Local filesystem (`media-files/`), backed up with `infra/backup-media.sh` |
| Hosting | **Single VPS running Docker Compose** (APIs, admin, web, Nginx) |
| CI | GitHub Actions under `server_1/.github/workflows` (lint, test, build, `npm audit`). **Target:** root `.github/workflows` covering all projects |

## Backend: `server_1`

| Concern | Choice |
|---------|--------|
| Framework | NestJS 11.1 (`platform-express`, `config`, `schedule`, `event-emitter`, `throttler`, `terminus`, `serve-static`) |
| ORM | Sequelize 6.37 + `sequelize-typescript` 2.1, `pg` 8.16 |
| Auth | Passport (`jwt`, `local`), `@nestjs/jwt`, bcrypt 6. Access token is short-lived and kept in memory; refresh token is an HttpOnly cookie. Public checkout uses an HMAC-SHA256 token |
| Authorization | CASL 6.7. Abilities are built from DB permission rows and cached in Redis, with pub/sub invalidation |
| Validation | `class-validator` 0.14, `class-transformer` 0.5 |
| Security | Helmet 7, throttler (rate limiting), cookie-parser, compression, Google reCAPTCHA Enterprise |
| Payments | Razorpay SDK (India), Stripe and Telr through platform services (`libs/platform/.../third-party`) |
| PDF | Puppeteer 24 + Handlebars templates, QR codes through `qrcode` |
| Email | Nodemailer 7 with DB-stored templates (`mst_email_templates`) |
| WhatsApp | Meta pre-approved templates |
| Calendar | `googleapis` (Google Calendar, two-way appointment sync) |
| Couriers | Nimbus Post, Shiprocket, Shipway through a courier factory and webhook strategies |
| Exports | `exceljs`, `archiver` |
| Observability | Sentry (`@sentry/nestjs` 10, public-api), Prometheus (`prom-client` + `@willsoto/nestjs-prometheus`), Terminus health checks |
| Utilities | lodash, moment, axios / `@nestjs/axios`, rxjs 7.8 |
| Testing | Jest 30, ts-jest, `@nestjs/testing` |
| Build | NX 22.3 (webpack / esbuild), SWC, TypeScript 5.9 |

### Layering (enforced by NX tags and ESLint module boundaries)

```
shared-dto → core → platform → modules → admin-only → apps
```

- `libs/core`: DB bootstrap, JWT, guards, interceptors, config, monitoring
- `libs/platform`: email, PDF, payment gateways, cache, file upload, labels, third-party clients
- `libs/modules/*`: about 30 feature domains (member, payment, tax-engine, delivery, diet, appointment, …)
- `libs/admin-only`: admin users, RBAC administration, reports
- `apps/public-api`, `apps/admin-api`: composition roots only

Request flow: **Controller → Service → Repository → Database.** Responses use the `IResponse<T>` envelope and errors use `IErrorResponse`.

## Admin CMS: `eatfit247-admin`

| Concern | Choice |
|---------|--------|
| Framework | Angular 20.3, NgModule-based with lazy-loaded feature libs (`libs/admin/*`) |
| UI | Angular Material / CDK 20, `material-icons`, SCSS token system (`var(--mat-*)`, no hardcoded colours) |
| Charts | ECharts 6 + `ngx-echarts` 20 |
| Rich text | `ngx-editor` 19 |
| Dates | moment + `@angular/material-moment-adapter` |
| Change detection | zone.js 0.15 |
| Testing | Jest 29 + `jest-preset-angular`, Playwright (e2e) |
| Build | `@angular/build` 20, NX 22.1 |

> **Planned migration:** upgrade the admin to Angular 21, standalone components and zoneless, to match the website (see roadmap). Until then, new admin components should be standalone + `inject()` where the feature lib allows it.

Feature lib convention: `api.service.ts`, `lib.routes.ts`, a list component, `manage/` (form), and optional `details/` tabs.

## Public Website: `eatfit247-web-1`

| Concern | Choice |
|---------|--------|
| Framework | Angular 21.1, standalone components, zoneless, `inject()` |
| Rendering | SSR with `@angular/ssr` + Express 4 |
| UI | Angular Material / CDK 21, SCSS tokens |
| Build | `@angular/build` 21, NX 22.4, Prettier 3 |
| Testing | None configured yet (see roadmap) |

## Data Conventions

- Tables: `mst_*` for master/lookup data, `txn_*` for transactional data. Columns are `snake_case`; models map them to camelCase.
- Every table carries audit columns (`created_by`, `modified_by`, timestamps, IP).
- Soft delete through `active = false`.
- Migrations are numbered raw SQL files in `db_changes/` (`NNN_description.sql`, currently at 135). Numbers must be unique.
- **Standard (decided):** a lightweight runner applies pending `db_changes/*.sql` files in order inside a transaction and records each one in a `schema_migrations` table. SQL stays the source of truth; there is no ORM migration tool. *Until the runner ships, migrations are applied by hand.*

## Testing

| | Today | Target standard (decided) |
|---|-------|---------------------------|
| Approach | Mostly manual testing | **Full automation for every feature**: backend integration + frontend end-to-end |
| Backend | Jest 30 + `@nestjs/testing`, few specs (RBAC, appointment) | Integration tests per endpoint against a real PostgreSQL test database (seeded, reset per run), plus unit tests for pure business logic (tax, sequences, state machines) |
| Admin | Jest + Playwright installed, not used in practice | Playwright e2e for each feature's main flows against the running admin-api + test DB |
| Website | No test runner | Playwright e2e (SSR build) for growth flows: enquiry, booking, checkout |
| CI | Server lint/build only | Every PR runs lint, unit, integration and e2e |

Until the test harness exists (roadmap Phase 5), each feature's `validation.md` lists the manual checks *and* the automated tests to add once the harness is ready.

## Coding Standards (all projects)

- TypeScript only. Never create `.js` files, and never use `any`.
- Shared frontend/backend shapes go in `shared-library`.
- Scaffold modules with NX generators (`npx nx g feature-module`, `npx nx g master-table`).
- Angular: always create `.html` + `.scss` files, use Material components, use `inject()` instead of constructor injection.
- Project-level details: [server_1/CLAUDE.md](../../server_1/CLAUDE.md), [eatfit247-admin/CLAUDE.md](../../eatfit247-admin/CLAUDE.md), [eatfit247-web-1/CLAUDE.md](../../eatfit247-web-1/CLAUDE.md), [infra/CLAUDE.md](../../infra/CLAUDE.md).
