# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run

```bash
npm install
npm start                    # dev server on :4200 (proxies /api → :3000, /media-files → :3001)
npm run build                # production SSR build → dist/eatfit247-web-1/
npx nx lint                  # ESLint (flat config, v9+)
```

Dev proxy: `proxy.config.json` routes `/api` to public-api (:3000) and `/media-files` to admin-api (:3001).

## Architecture

Angular 21 SSR website — standalone components, zoneless change detection, no NgModules.

```
src/app/
├── core/
│   ├── services/          # HttpService, SEO, Payment, Checkout, Theme, etc.
│   └── interfaces/        # Typed response/request interfaces
├── ui/
│   ├── public-shell/      # Shell layout (header + main + footer + mobile CTA)
│   ├── home/              # Homepage
│   ├── checkout/          # Multi-step checkout flow (product & plan)
│   └── ...               # Each page is a standalone lazy-loaded component
libs/
└── shared-ui/             # Reusable presentational components (Banner, Card, Container, etc.)
```

## Routing & SSR

All routes are children of `PublicShellComponent` and use `loadComponent()` for lazy loading.

- Static pages: pre-rendered at build time (SSR default)
- Dynamic routes (`:id`, `:slug`, `**`): `RenderMode.Server` (per-request SSR)
- `withComponentInputBinding()` enabled — route params bind directly to `@Input()` properties

## Key Patterns

**HTTP Layer**: `HttpService` wraps `HttpClient` with async/await (`firstValueFrom()`). No HTTP interceptors — error handling lives in the service. All API responses follow `IResponse<T>` with `.data` property.

**SSR Safety**: Services that use browser APIs (localStorage, sessionStorage, window.Razorpay, grecaptcha) check `isPlatformBrowser()` before access.

**Checkout Flow**: Session-based tokens stored in `sessionStorage['checkoutToken']`, passed via custom auth headers. Separate endpoints for product vs plan checkout.

**SEO**: `SeoService` auto-fetches page SEO on navigation. `JsonLdService` injects global org schemas on init + page-specific schemas (Product, BlogPosting, FAQ). Every route has a `title` property.

**reCAPTCHA v3**: Lazy-loaded script, site key fetched from backend if not in environment. Token passed via `X-Recaptcha-Token` header.

**Payment Gateway**: Razorpay script loaded dynamically. Two-phase: create order → verify payment. Browser-only.

**State Management**: No global store (no NgRx). Services manage their own state using Angular signals for reactivity.

## Path Aliases

| Alias | Target |
|-------|--------|
| `@shared-ui` | `libs/shared-ui/src/index.ts` |
| `@shared-ui/layout` | `libs/shared-ui/src/lib/layout/index.ts` |
| `@eatfit247-shared-library` | `../shared-library/src/index.ts` |
| `@env` | `src/environments/environment.ts` |

## Code Standards

- **Standalone components only** with `inject()` — no constructor DI, no NgModules
- **Zoneless change detection** (`provideZonelessChangeDetection`)
- **`withFetch()`** — uses Fetch API, not XMLHttpRequest
- **No `any` keyword** — typed interfaces for all data
- **Always create `.html` and `.scss` files** alongside component `.ts`
- **No hardcoded colors** — use CSS custom properties from the 3-tier design token system
- **Component selectors**: `app-` prefix, `kebab-case`
- **Directive selectors**: `app` prefix, `camelCase`

## Design Token System (src/styles/)

```
_primitive-tokens.scss      # Raw color/size values
_semantic-tokens.scss       # Purpose-mapped tokens (primary, surface, error)
_component-tokens.scss      # Component-scoped tokens
_breakpoints.scss           # Responsive breakpoints
_spacing-tokens.scss        # Spacing scale
_typography-tokens.scss     # Font scale
_accessibility.scss         # WCAG compliance utilities
```

## Environment Config

- Dev: `apiUrl: 'http://localhost:3000/api/v2/public'`
- Prod: `apiUrl: '/api/v2/public'` (relative, handled by reverse proxy)
- File replacement configured in `project.json` build configurations
