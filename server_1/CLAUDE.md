# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run

```bash
npm install                  # also runs postinstall → builds shared-library
npm start                    # starts both admin-api (:3001) and public-api (:3000)
npm run start:admin          # admin-api only
npm run start:public         # public-api only
npm run build                # production build (clears NX cache, builds both apps)
npm run build:admin          # build admin-api only
npm run build:public         # build public-api only
```

## Lint & Test

```bash
npm run lint                 # ESLint across all libs/apps
npm run test                 # Jest unit tests
npm run test:e2e             # end-to-end tests
npm run test:cov             # coverage report
npx nx test <project-name>  # run tests for a single library (e.g., npx nx test core)
```

## NX Commands

```bash
npx nx serve admin-api       # dev server for admin-api
npx nx serve public-api      # dev server for public-api
npx nx build core            # build a specific library
npx nx graph                 # visualize dependency graph (verify no circular deps)
npx nx g feature-module <name>   # generate a new feature module
npx nx g master-table <name>     # generate a new master table module
npm run analyze:dependencies     # generate custom dependency graph JSON
```

Always use NX generators for new modules — never create them manually.

## Architecture

Strict layered NX monorepo. Dependencies only flow upward — enforced by `.eslintrc.json` module boundary rules and NX tags in `nx.json`.

```
shared-dto   (pure TS: DTOs, enums, interfaces)        tag: type:shared
    ↑
  core       (DB bootstrap, JWT, guards, interceptors)  tag: type:core
    ↑
platform     (master data, email, PDF, payments)        tag: type:platform
    ↑
modules      (28 feature domains)                       tag: type:domain
    ↑
admin-only   (admin-user CRUD, reports)                 tag: type:admin-only
    ↑
  apps       (admin-api :3001 | public-api :3000)       tag: type:app
```

**Never import between sibling feature modules.** Cross-module data sharing uses Sequelize string-based model resolution at runtime (avoids NX circular dependency).

### Path Aliases (tsconfig.base.json)

```
@eatfit247-shared-lib     → ../shared-library/dist/index
@server_1/core            → libs/core/src/index.ts
@server_1/platform        → libs/platform/src/index.ts
@server_1/modules/*       → libs/modules/*/index.ts
@server_1/admin-only/*    → libs/admin-only/*/index.ts
@server_1/models/product  → libs/models/product/src/index.ts
```

## Two API Applications

| App | Port | Prefix | Purpose |
|-----|------|--------|---------|
| `admin-api` | 3001 (`ADMIN_API_PORT`) | `/api/v2/admin` | Admin CMS operations (imports 32 modules) |
| `public-api` | 3000 (`PORT`) | `/api/v2/public` | Public website operations (imports 12 modules) |

Both share the same libraries but import different sets of modules. Bootstrap: `apps/{app}/src/main.ts`. Module wiring: `apps/{app}/src/app/app.module.ts`.

Both apps configure globally: `ValidationPipe`, `TransformInterceptor`, `ValidationFilter`, `GlobalExceptionsFilter`, Helmet, compression, cookie-parser, CORS, ThrottlerGuard (100 req/min). Public API additionally includes Sentry.

## Key Patterns

### Controller → Service → Repository → Database
Controllers handle HTTP only; business logic lives in services; data access through Sequelize models directly in services (no separate repository classes — services use `Model.scope('list').findAndCountAll()` directly).

### Model Registry
Feature modules MUST register their Sequelize models via `modelRegistry.register([...])` **before** `CommonModule.forRoot()` initializes Sequelize. The registry (`libs/core/src/lib/database/model-registry.ts`) collects all models, then `CommonModule.forRoot()` passes them to `SequelizeModule.forRoot()`.

```typescript
// In feature module file (top-level, before @Module decorator)
modelRegistry.register([TxnMember, TxnMemberPayment]);

@Module({ ... })
export class MemberModule {}
```

### Sequelize Scopes
Models define `@Scopes()` with named query presets (`list`, `details`) that include associations and creator/updater info. Services call `Model.scope('list').findAndCountAll()` or `Model.scope('details').findByPk()`.

### Cross-Module Sequelize Includes
To avoid NX-forbidden imports between sibling modules, use **string-based model names** in Sequelize `include`:
```typescript
{ model: 'MstFranchise', as: 'franchise', required: false }
```

### DTO Rules
- **Services must NOT import DTOs** — ESLint warns on this. Services work with interfaces; DTOs are controller-layer only.
- Shared interfaces come from `@eatfit247-shared-lib`. Module-specific DTOs live in `libs/modules/{module}/src/dto/`.
- DTOs use `class-validator` decorators and implement shared-lib interfaces.

### Model Naming
`mst-*` = master/lookup tables, `txn-*` = transactional tables. All DB column names use `snake_case` (mapped via Sequelize `field` property to camelCase TS properties).

### Auth Flow
JWT access token (in-memory, 15min default) + refresh token (HttpOnly Secure cookie, 7 days default). `JwtAuthGuard` global guard on all routes. CASL (`AbilitiesGuard`) for role-based permissions. `CheckoutTokenGuard` for public checkout sessions (HMAC-SHA256, no JWT required).

### Standard Response Shape
`TransformInterceptor` wraps all responses into `IResponse<T>`: `{ code, message, data }`. Defined in `@eatfit247-shared-lib`.

### Environment Config
All env vars accessed via static `Env` class (`libs/core/src/lib/config/env.values.ts`). Access as `Env.databaseUsername`, `Env.jwtSecret`, etc.

### Payment Resolution
`PaymentGatewayResolverService` selects Razorpay/Stripe/Telr based on member country + franchise config + currency. Tax is pre-calculated at payment time, never at invoice/PDF rendering time.

### PDF & Email Templates
- **PDF**: Handlebars templates in `/templates/` rendered by Puppeteer (`PdfService` in platform lib). Templates: invoice, diet-plan, recipe.
- **Email**: EJS templates in `/templates/member/` rendered by `EmailNotificationService` via Nodemailer. 11 templates (welcome, invoices, diet plans, calls, password reset).
- **WhatsApp**: Text templates in `/templates/member/` for shorter notifications.

## Feature Module Internal Structure

Each of the 28 modules in `libs/modules/` follows this layout:
```
{module}/src/
├── controllers/
│   ├── admin/         # admin-api controllers
│   └── public/        # public-api controllers (if applicable)
├── services/          # business logic
├── models/            # Sequelize model definitions (txn-* or mst-*)
├── dto/               # class-validator DTOs (controller layer only)
└── {module}.module.ts # NestJS module definition
```

File naming: `entity-context.controller.ts`, `entity-context.service.ts`, `txn-entity.model.ts`, `mst-entity.model.ts`.

## Shared Library Dependency

This project depends on `shared-library` (parent directory). It is built automatically via `postinstall`, but if you modify shared-library interfaces/enums, rebuild it:

```bash
cd ../shared-library && npm run build
```

Import path: `@eatfit247-shared-lib`

## Key Entry Points

| Purpose | File |
|---------|------|
| Admin API bootstrap | `apps/admin-api/src/main.ts` |
| Public API bootstrap | `apps/public-api/src/main.ts` |
| Admin module wiring | `apps/admin-api/src/app/app.module.ts` |
| Public module wiring | `apps/public-api/src/app/app.module.ts` |
| DB + JWT initialization | `libs/core/src/lib/common.module.ts` |
| Environment config | `libs/core/src/lib/config/env.values.ts` |
| Model registry | `libs/core/src/lib/database/model-registry.ts` |
| DB connection config | `libs/core/src/lib/database/db-config.ts` |
| Response interceptor | `libs/core/src/lib/interceptors/transform.interceptor.ts` |
| Auth decorators | `libs/core/src/lib/decorators/` |
| CASL permissions | `libs/core/src/lib/auth/casl-ability.factory.ts` |
| Platform services | `libs/platform/src/lib/platform.module.ts` |
