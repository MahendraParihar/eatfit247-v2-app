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
```

## NX Commands

```bash
npx nx serve admin-api       # dev server for admin-api
npx nx serve public-api      # dev server for public-api
npx nx build core            # build a specific library
npx nx graph                 # visualize dependency graph (verify no circular deps)
npx nx g feature-module <name>   # generate a new feature module
npx nx g master-table <name>     # generate a new master table module
```

Always use NX generators for new modules — never create them manually.

## Architecture

Strict layered NX monorepo. Dependencies only flow upward — enforced by `.eslintrc.json` module boundary rules.

```
shared-dto   (pure TS: DTOs, enums, interfaces)
    ↑
  core       (DB bootstrap, JWT, guards, interceptors, config)
    ↑
platform     (master data, email, PDF, payments, 3rd-party integrations)
    ↑
modules      (28 feature domains — each owns models/services/controllers)
    ↑
admin-only   (admin-user CRUD, reports — only admin-api may import)
    ↑
  apps       (admin-api :3001 | public-api :3000 — thin wiring shells)
```

**Never import between sibling feature modules.** Cross-module data sharing uses Sequelize string-based model resolution at runtime (avoids NX circular dependency).

## Key Patterns

- **Controller → Service → Repository → Database**: Controllers handle HTTP only; business logic lives in services; data access in repositories.
- **Model naming**: `mst-*` = master/lookup tables, `txn-*` = transactional tables. All DB column names use `snake_case`.
- **Auth flow**: JWT access token (in-memory) + refresh token (HttpOnly Secure cookie). CASL for role-based permissions.
- **Sequelize cross-lib JOINs**: Use string model names in `include` to avoid NX-forbidden TypeScript imports.
- **Standard response shape**: `TransformInterceptor` wraps all responses. Use DTOs from `libs/core/src/lib/dto/`.
- **PDF generation**: Puppeteer renders Handlebars templates from `/templates/` directory.
- **Payment resolution**: `PaymentGatewayResolverService` selects Razorpay/Stripe/Telr based on member country/franchise config.
- **Tax strategy**: Tax is pre-calculated at payment time, never at invoice/PDF rendering time.
- **Environment config**: All env vars accessed via `Env` class (`libs/core/src/lib/config/`).

## Two API Applications

| App | Port | Prefix | Purpose |
|-----|------|--------|---------|
| `admin-api` | 3001 | `/api/v2/admin` | Admin CMS operations (32 modules) |
| `public-api` | 3000 | `/api/v2/public` | Public website operations (12 modules) |

Both share the same libraries but import different sets of modules.

## Shared Library Dependency

This project depends on `shared-library` (parent directory). It is built automatically via `postinstall`, but if you modify shared-library interfaces/enums, rebuild it:

```bash
cd ../shared-library && npm run build
```

Import path: `@eatfit247-shared-lib`
