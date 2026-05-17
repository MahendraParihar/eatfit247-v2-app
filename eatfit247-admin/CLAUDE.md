# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run

```bash
npm install
npm start                    # dev server on :4200, proxies to admin-api at :3001
npm run build                # production build
npm test                     # Jest unit tests
npm run lint                 # ESLint
npx playwright test          # Playwright e2e tests (from e2e/ directory)
```

Dev proxy config: `proxy.conf.json` → `http://localhost:3001/api/v2/admin`

## Architecture

NgModule-based Angular 20 SPA (no SSR) using NX monorepo structure.

```
src/app/           # Root module, routing, auth pages (login, forgot/reset password)
libs/
├── core/          # Guards, interceptors, services, models (AuthGuard, AuthInterceptor, ApiBaseService)
├── shared-ui/     # Reusable UI components (DataTable, AlertDialog, AddressForm, SeoForm, etc.)
├── styles/        # 3-tier SCSS design token system (primitive → semantic → component tokens)
└── admin/         # 27 lazy-loaded feature modules
```

## Code Standards

- **Angular Material only**: Always use `mat-*` components. Never use raw HTML buttons, inputs, or tables.
- **No hardcoded colors**: Use CSS custom properties (`var(--mat-*)`, `var(--mdc-*)`). Never hardcode hex/RGB/HSL.
- **No `any` keyword**: Define typed interfaces. Use `IApiResponse<T>` for API responses.
- **Standalone components with `inject()`**: Prefer `inject(Service)` over constructor injection.
- **Always create `.html` and `.scss` files** alongside component `.ts` files.
- **Shared interfaces**: Anything shared with backend goes in `shared-library` via `@eatfit247-shared-lib`. Frontend-only interfaces stay in the admin app.
- **Design tokens**: Border-radius 0 everywhere except buttons (12px). WCAG 2.1 AA compliant.

## Feature Module Convention

Each admin feature module follows this structure:

```
libs/admin/<module>/src/lib/
├── api.service.ts           # All HTTP calls for this feature
├── lib.routes.ts            # Lazy-loaded child routes
├── <module>.component.ts    # List/index page
├── manage/                  # Create/Edit form page
└── details/                 # (members module only) sub-tab pages
```

## Core Services

| Service | Purpose |
|---------|---------|
| `AuthGuard` / `LoginGuard` | Route protection |
| `AuthInterceptor` | Attaches JWT Bearer token to requests |
| `HttpErrorInterceptor` | 401 → logout redirect |
| `HttpService` | Centralized HTTP service with typed responses |
| `AuthService` | Login/logout/refresh token management |
| `StorageService` | In-memory token storage (no localStorage for access tokens) |

## Shared Library Dependency

This project depends on `shared-library` (parent directory). If you modify shared-library interfaces/enums, rebuild:

```bash
cd ../shared-library && npm run build
```

Import path: `@eatfit247-shared-lib`
