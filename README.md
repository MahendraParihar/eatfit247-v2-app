# EatFit247 v2 — Full-Stack Monorepo

A comprehensive monorepo for the EatFit247 digital platform — a health & nutrition coaching service. Contains the public website, admin CMS, NestJS backend APIs, and a shared TypeScript library.

---

## Monorepo Structure

```
eatfit247-v2-app/
├── eatfit247-admin/        # Angular 20 Admin CMS (Nx monorepo)
├── eatfit247-web-1/        # Angular 21 SSR Public Website (Nx)
├── server_1/               # NestJS Backend API (Nx monorepo)
├── shared-library/         # Shared TypeScript interfaces, enums & utils
├── infra/                  # Docker, Nginx, SSL, env templates
└── README.md
```

---

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [Tech Stack Summary](#tech-stack-summary)
3. [server\_1 — Backend API](#server_1--backend-api)
4. [eatfit247-admin — Admin CMS](#eatfit247-admin--admin-cms)
5. [eatfit247-web-1 — Public Website](#eatfit247-web-1--public-website)
6. [shared-library](#shared-library)
7. [Infrastructure & Docker](#infrastructure--docker)
8. [Development Setup](#development-setup)
9. [Universal Invoice System](#universal-invoice-system)

---

## Platform Overview

| Project | Type | Framework | Dev Port | Purpose |
|---|---|---|---|---|
| `server_1` (admin-api) | Backend | NestJS 11 | `3001` | Admin-facing REST API |
| `server_1` (public-api) | Backend | NestJS 11 | `3000` | Public-facing REST API |
| `eatfit247-admin` | Frontend | Angular 20 | `4200` | Internal admin CMS panel |
| `eatfit247-web-1` | Frontend | Angular 21 + SSR | `4200` | Public website with SSR |
| `shared-library` | Library | TypeScript | — | Shared types, enums, utils |

**Business Domain**: EatFit247 is a health & nutrition coaching platform offering personalized diet programs, member management, blog/recipe content, e-commerce (products + plans), and multi-country payment processing.

---

## Tech Stack Summary

### Backend (`server_1`)

| Category | Technology | Version |
|---|---|---|
| Framework | NestJS | 11.x |
| Monorepo | NX Workspace | 22.3.3 |
| Language | TypeScript | 5.9.3 |
| Database | PostgreSQL | 8.x (pg driver) |
| ORM | Sequelize + sequelize-typescript | 6.37 / 2.1.6 |
| Auth | Passport JWT + Local + `@nestjs/jwt` | 11.x |
| Authorization | CASL (`@casl/ability`) | 6.7 |
| Caching | Redis (`ioredis` + `cache-manager-redis-store`) | — |
| Security | Helmet, bcrypt, reCAPTCHA Enterprise, Throttler | — |
| Payment Gateways | Razorpay SDK, Stripe (custom), Telr (custom) | — |
| PDF Generation | Puppeteer + Handlebars templates | 24.x |
| Email | Nodemailer + Handlebars templates | — |
| Google APIs | `googleapis` (Calendar, reCAPTCHA) | 169.x |
| Validation | class-validator + class-transformer | 0.14.3 |
| HTTP Client | Axios + `@nestjs/axios` | — |
| Monitoring | Sentry (`@sentry/nestjs`), Prometheus (`prom-client`) | — |
| Scheduling | `@nestjs/schedule` | — |
| Process Manager | PM2 (`ecosystem.config.js`) | — |
| Build | Webpack + esbuild + SWC | — |
| Testing | Jest + `@nestjs/testing` | 30.x |

### Admin Frontend (`eatfit247-admin`)

| Category | Technology | Version |
|---|---|---|
| Framework | Angular | ~20.3 |
| UI Library | Angular Material + CDK | ^20.2 |
| Monorepo | NX | 22.1.3 |
| App Style | NgModule-based | — |
| Date Handling | moment.js | ^2.30 |
| Rich Text Editor | ngx-editor | 19.x |
| SSR | None (SPA) | — |
| Testing (unit) | Jest + jest-preset-angular | 29.x |
| Testing (e2e) | Playwright | ^1.36 |
| Styles | SCSS + design token system | — |
| Shared Library | `eatfit247-shared-library` (local file dep) | — |

### Public Website (`eatfit247-web-1`)

| Category | Technology | Version |
|---|---|---|
| Framework | Angular | ~21.1 |
| SSR | `@angular/ssr` + Express | ~21.1 |
| UI Library | Angular Material + CDK | ^21.1 |
| Monorepo | NX | 22.4.5 |
| App Style | Standalone components, zoneless | — |
| Styles | SCSS + 3-tier design token system | — |
| Style Linting | Stylelint | — |
| Build | esbuild (SSR mode) | — |

---

## server\_1 — Backend API

### Architecture

The backend is a **strict layered NestJS monorepo** using NX. Dependencies only flow upward — no circular imports.

```
shared-dto  (pure TS: DTOs, enums, interfaces)
    ↑
  core      (DB bootstrap, JWT, guards, interceptors, config)
    ↑
platform    (master data, email, PDF, payments, 3rd-party services)
    ↑
modules     (28 feature domains — each owns its models/services/controllers)
    ↑
admin-only  (admin-user CRUD, reports — only admin-api may import)
    ↑
  apps      (admin-api :3001 | public-api :3000 — thin wiring shells)
```

### Applications

| App | Port | API Prefix | Registered Modules |
|---|---|---|---|
| `admin-api` | 3001 | `/api/v2/admin` | 32 modules |
| `public-api` | 3000 | `/api/v2/public` | 12 modules |

### Library Breakdown

#### `libs/core` — Framework Foundation
- `CommonModule` — DB + config + cache bootstrap
- `database/` — core Sequelize models: admin users, roles, permissions, franchise, app-config, contact form
- `auth/` — JWT strategy, guards, `admin-user.service.ts`
- `decorators/` — `@Auth()`, `@User()`, `@RequestedIp()`
- `dto/` — Shared DTOs: table list, SEO, address, status-change
- `error-handler/` — `GlobalExceptionFilter`
- `guards/` — `JwtAuthGuard`, `CheckoutTokenGuard`, `JwtStrategy`
- `interceptors/` — `TransformInterceptor` (standard response shape)
- `monitoring/` — `SentryModule`, `SentryInterceptor`, `MetricsModule` (Prometheus)
- `health/` — `HealthController` liveness endpoint
- `utils/` — `checkout-token.util.ts`, `crypto.util.ts`, `common-functions.utils.ts`, `payment.util.ts`, `search.util.ts`
- `config/` — `Env` class (all env vars), `AppConfigService`

#### `libs/platform` — Cross-Domain Infrastructure
- `PlatformModule` (dynamic, `.forRoot()`) — DB connection wiring
- `database/models/` — Platform-wide master/lookup models:
  `mst-country`, `mst-state`, `mst-currencies`, `mst-email-template`, `mst-payment-gateway`, `mst-payment-mode`, `mst-payment-status`, `mst-seo-page`, `txn-address`, `label`, `log-error`, `invoice-sequence`
- `services/` — `AddressService`, `CountryService`, `CurrencyService`, `EmailNotificationService`, `InvoiceSequenceService`, `LogErrorService`, `PaymentGatewayService`, `PaymentModeService`, `SeoPageService`, `StateService`
- `third-party/` — `RazorpayService`, `StripeService`, `TelrService`, `ZoomService`, `GoogleService`
- `pdf/` — `PdfService` (Puppeteer), `DietPlanPdfService`, `InvoicePdfService`
- `label/` — i18n label system: `LabelService`, `LabelDataService`, `LabelFactory`
- `guards/` — `RecaptchaGuard` (Google reCAPTCHA Enterprise)
- `file-upload/` — `FileUploadController` (Multer-based media uploads)
- `cache/` — Redis cache wiring
- `logging/` — `LogErrorService`

#### `libs/models/product` — Shared Product Models
Standalone Sequelize models used across feature modules without creating NX cycles:
`mst-product`, `mst-product-variant`, `mst-product-price`

#### `libs/modules` — Feature Modules (28 domains)

| Module | Description |
|---|---|
| `auth` | Admin login, JWT access + refresh tokens, password reset |
| `member` | Full member lifecycle: profile, diet plan, assessment, health tracking, issues, call logs, pocket guides, products |
| `assessment` | Health assessment lookups: gender, health issues, lifestyle, sleeping pattern, blood sugar, etc. |
| `program-plan` | Programs, plan types, plan fees, categories |
| `product` | Product catalog (admin + public split) |
| `diet` | Diet templates and diet plan details |
| `payment` | Payment gateway adapter, credentials, resolver |
| `tax-engine` | India GST, VAT (UAE), US no-tax strategies |
| `delivery` | Courier providers, warehouses, shipments, tracking, webhook processing |
| `blogs` | Blog authors, categories, articles (admin + public split) |
| `faq` | FAQ categories and questions (admin + public split) |
| `recipe` | Recipes, categories, cuisines, types, nutritional data |
| `banner` | Site banners (admin + public split) |
| `pages` | Legal pages + SEO pages (admin + public split) |
| `referrer` | Referrer tracking (admin + public split) |
| `notification` | Email, WhatsApp, notification log, template management |
| `contact` | Contact form submission + admin report |
| `franchise` | Franchise management + payment gateway config |
| `locations` | Countries, states, addresses (admin + public split) |
| `call-logs` | Call log status, purpose, type lookups |
| `issues` | Issue categories, statuses |
| `pocket-guide` | Pocket guide master data |
| `press-media` | Press & media articles (admin + public) |
| `success-stories` | Member success stories (admin + public) |
| `promo-code` | Promotional code engine |
| `google-calendar` | Google Calendar integration for session scheduling |
| `member-testimonial` | Member testimonials |
| `lovs` | Lists of Values (payment status, etc.) |

#### `libs/admin-only` — Admin-Exclusive Features

| Sub-lib | Description |
|---|---|
| `admin-user` | Admin user CRUD, roles, CASL-based permissions |
| `reports` | Dashboard stats, payment reports, member-product reports |

### Database Models

The project uses `mst-` (master/lookup) and `txn-` (transactional) naming conventions across **70+ Sequelize models** mapped to PostgreSQL tables.

**Key model groups:**
- Admin: `mst-admin-role`, `mst-admin-user`, `mst-admin-role-permission`, `txn-admin-refresh-token`, `txn-admin-password-reset-token`
- Member: `txn-member`, `txn-assessment`, `txn-member-diet-plan`, `txn-member-health-parameter`, `txn-member-payment`, `txn-member-product`
- Program: `mst-program`, `mst-program-category`, `mst-program-plan`, `mst-program-plan-fees`
- Delivery: `mst-courier-provider`, `mst-warehouse`, `txn-shipment`, `txn-shipment-tracking-event`
- Content: `txn-blog`, `mst-blog-author`, `mst-blog-category`, `mst-recipe`, `txn-faq`
- Platform: `mst-country`, `mst-state`, `mst-email-template`, `mst-payment-gateway`, `mst-seo-page`, `log-error`, `invoice-sequence`

### Sequelize JOIN Strategy

Sequelize resolves models by **string name at runtime**, allowing cross-lib JOINs without NX-visible TypeScript imports (which would create forbidden circular deps):

```ts
this.blogRepo.findAll({
  include: [{ model: 'MstAdminUser', attributes: ['admin_user_id', 'name'] }],
});
```

### Auth Flow

1. `POST /auth/login` → validates credentials with bcrypt → issues JWT access token (memory) + refresh token (HttpOnly Secure cookie)
2. Protected routes → `JwtAuthGuard` + `JwtStrategy`
3. `POST /auth/refresh` → reads cookie → rotates both tokens
4. `POST /auth/logout` → revokes DB token + clears cookie
5. CASL ability rules control per-resource permissions for admin roles

### Notification Services

- **Email**: Nodemailer + Handlebars `.hbs` templates → `EmailNotificationService`
- **WhatsApp**: `whatsapp.service.ts` via third-party API
- **Logs**: all sent notifications tracked in `notification-log` table

### PDF Services

- **Puppeteer** renders Handlebars templates server-side
- Templates: `diet-plan.hbs`, `invoice.hbs`, `recipe.hbs`, `header.hbs`, `footer.hbs`
- Services: `DietPlanPdfService`, `InvoicePdfService`

### Payment Gateways

| Gateway | Adapter |
|---|---|
| Razorpay | `razorpay.service.ts` (official SDK) |
| Stripe | `stripe.service.ts` (custom HTTP) |
| Telr | `telr.service.ts` (custom HTTP) |

Resolved via `PaymentGatewayResolverService` based on member country/franchise config.

---

## eatfit247-admin — Admin CMS

An **NgModule-based Angular 20 SPA** (no SSR) serving as the internal CMS for managing all platform data.

### Project Structure

```
eatfit247-admin/
├── src/app/            # Root module, routing, auth pages (login, forgot/reset password)
├── libs/
│   ├── core/           # Guards, interceptors, services, models
│   ├── shared-ui/      # Reusable UI component library
│   ├── styles/         # Global SCSS design token system
│   └── admin/          # 27 lazy-loaded feature modules
├── e2e/                # Playwright end-to-end tests
└── proxy.conf.json     # Dev proxy → http://localhost:3001/api/v2/admin
```

### Core Library (`libs/core`)

| Item | Purpose |
|---|---|
| `AuthGuard` | Protects all authenticated routes |
| `LoginGuard` | Redirects away from `/login` if already authenticated |
| `AuthInterceptor` | Attaches JWT Bearer token to every HTTP request |
| `HttpErrorInterceptor` | Handles 401 → logout redirect |
| `ApiBaseService` | Base HTTP service with typed responses |
| `AuthService` | Token management, login/logout/refresh |
| `BreadcrumbService` | Reactive breadcrumb data |
| `StorageService` | In-memory token storage (no localStorage for access tokens) |

### Shared UI Library (`libs/shared-ui`)

| Component | Purpose |
|---|---|
| `DataTableComponent` | Generic API-driven data table (sort, paginate, search, formatters) |
| `AlertDialogComponent` | Error/info alert modal |
| `ConfirmationMenuComponent` | Inline row delete/confirm UI |
| `AddressFormComponent` | Reusable address fields form |
| `BreadcrumbComponent` | Navigation breadcrumbs |
| `EmptyStateComponent` | Empty list/result state |
| `LoaderComponent` | Full-screen loading spinner |
| `InputErrorComponent` | Reactive form field error messages |
| `SeoFormComponent` | SEO metadata fields |
| `UploadFormComponent` | Drag-and-drop media upload |
| `WarningDialogComponent` | Confirmation dialog |
| `AddressPipe` | Formats address object to string |
| `CurrencyPipe` | Formats number with currency |

### Design System (`libs/styles`)

Three-tier SCSS token system:
- `_design-tokens.scss` — primitive + semantic tokens
- `_status-tokens.scss` — success / warning / error / info
- `_theme.scss` — Material 3 light + dark theme config
- `_variables.scss`, `_mixins.scss`, `_functions.scss`

**Key rules**: No hardcoded colors, all via CSS custom properties; border-radius 0 everywhere except buttons (12px); WCAG 2.1 AA compliant.

### Feature Modules (`libs/admin/`) — 27 lazy-loaded modules

| Module | Route |
|---|---|
| `dashboard` | `/dashboard` |
| `members` | `/members` (full member CRM with sub-tabs) |
| `blogs` | `/blogs` |
| `faq` | `/faq` |
| `recipes` | `/recipes` |
| `products` | `/products` |
| `program-plan` | `/program-plans` |
| `programs` | `/programs` |
| `diet-template` | `/diet-template` |
| `banners` | `/banners` |
| `legal-pages` | `/legal-pages` |
| `seo-page` | `/seo-page` |
| `success-stories` | `/success-stories` |
| `press-media` | `/media-press` |
| `referrer` | `/referrer` |
| `franchise` | `/franchise` |
| `pocket-guide` | `/pocket-guide` |
| `call-logs` | `/call-logs` |
| `issues` | `/issues` |
| `admin-user` | `/admin-user` |
| `promo-code` | `/promo-code` |
| `tax-master` | `/tax-master` |
| `lov-master` | `/lov-master` |
| `reports` | `/reports` |
| `delivery` | `/delivery/*` (courier providers, warehouses, accounts) |

**`members` module** is the most complex — includes deep sub-tabs: assessment, diet-plan, diet-history, health parameters, issues, call-logs, payment-history, product-orders, pocket-guide, addresses.

### Module Internal Structure (Convention)

Each admin feature module follows a consistent pattern:
```
libs/admin/<module>/src/lib/
├── api.service.ts      # All HTTP calls for this feature
├── lib.routes.ts       # Child routes
├── <module>.component.ts  # List/index page
├── manage/             # Create / Edit form page
└── details/            # (members only) sub-tab pages
```

---

## eatfit247-web-1 — Public Website

An **Angular 21 SSR website** using standalone components and zoneless change detection. Delivers the public-facing EatFit247 marketing and e-commerce pages.

### Project Structure

```
eatfit247-web-1/
├── src/
│   ├── app/
│   │   ├── core/       # Services, interfaces, utils
│   │   └── ui/         # All page components (standalone)
│   ├── environments/
│   ├── styles/         # 3-tier SCSS design token system
│   ├── main.ts         # CSR bootstrap
│   ├── main.server.ts  # SSR bootstrap
│   └── server.ts       # Express SSR server
├── libs/shared-ui/     # Public-facing shared UI components
└── proxy.config.json   # Dev proxy → http://localhost:3000/api/v2/public
```

### SSR Architecture

```
Angular CLI (esbuild)
    ↓
main.server.ts  →  app.config.server.ts  →  app.routes.server.ts
    ↓
server.ts (Express)  →  serves browser/ static + SSR requests
```

- Static routes → Angular pre-rendered (SSR default)
- Dynamic routes (`:id`, `:slug`, `**`) → `RenderMode.Server` (per-request SSR)

### Core Services

| Service | Purpose |
|---|---|
| `BannerService` | Fetch site banners |
| `BlogService` | Blog listing and detail |
| `CheckoutService` | Plan checkout flow, token management |
| `PaymentService` | Payment initiation and verification |
| `ProductService` | Product catalog and detail |
| `ProgramPlanService` | Program plan listing and detail |
| `SeoPageService` | Per-page SEO metadata from API |
| `SeoService` | Sets Angular `Meta` + `Title` tags |
| `SuccessStoriesService` | Member success stories |
| `PressMediaService` | Press and media articles |
| `LegalPagesService` | Terms, privacy policy content |
| `RecaptchaService` | Google reCAPTCHA v3 integration |
| `ReferrerService` | Referrer/affiliate tracking |
| `ThemeService` | Light/dark theme switching |

### Pages & Routes

| Route | Component | Render Mode |
|---|---|---|
| `/` | HomeComponent | SSR |
| `/about-us` | AboutEatfitComponent | SSR |
| `/about-shweta-shah` | AboutShwetaShahComponent | SSR |
| `/our-programs` | OurProgramsComponent | SSR |
| `/our-programs/:id` | ProgramDetailsComponent | Server (per-request) |
| `/success-stories` | SuccessStoriesComponent | SSR |
| `/blog` | BlogComponent | SSR |
| `/blog/:slug` | BlogDetailsComponent | Server (per-request) |
| `/press-and-media` | PressAndMediaComponent | SSR |
| `/product` | ProductComponent | SSR |
| `/product/:slug` | ProductComponent | Server (per-request) |
| `/know-your-body-dosha` | KnowYourBodyDoshaComponent | SSR |
| `/know-your-current-immunity-score` | KnowYourCurrentImmunityScoreComponent | SSR |
| `/checkout` | CheckoutComponent | SSR |
| `/checkout/success` | CheckoutSuccessComponent | SSR |
| `/contact-us` | ContactUsComponent | SSR |
| `/faq` | FaqComponent | SSR |
| `/terms-and-conditions` | TermsAndConditionsComponent | SSR |
| `/privacy-policy` | PrivacyPolicyComponent | SSR |
| `/**` | NotFoundComponent | Server (per-request) |

### Shared UI Library (`libs/shared-ui`)

| Component | Purpose |
|---|---|
| `BannerComponent` | Hero/section banners |
| `CardComponent` | Reusable content card |
| `EmptyStateComponent` | Empty result display |
| `ContainerComponent` | Page-width container |
| `SectionComponent` | Section wrapper |
| `LoaderComponent` | Loading spinner |
| `SocialSiteComponent` | Social media icons/links |

### Design Token System (`src/styles/`)

Three-tier token architecture:
1. `_primitive-tokens.scss` — raw color/size values
2. `_semantic-tokens.scss` — purpose-mapped tokens (primary, surface, error, etc.)
3. `_component-tokens.scss` — component-scoped tokens

Plus: `_accessibility.scss`, `_breakpoints.scss`, `_spacing-tokens.scss`, `_typography-tokens.scss`, `_grid-utilities.scss`, `_button-utilities.scss`

---

## shared-library

Pure TypeScript library (no framework dependencies) shared between `eatfit247-admin` and `server_1`.

### Structure

```
shared-library/
├── src/
│   ├── base.interface.ts
│   ├── core/
│   │   └── invoice/        # InvoiceDocument, MemberInfo, mapPaymentToInvoiceDocument
│   ├── auth/               # IAuthUser, IAdminUser, IMember
│   ├── enum/               # All platform enums
│   ├── utils/              # ValidationUtil, CommonUtil, CryptoUtil
│   └── index.ts
└── dist/                   # Compiled output (must be built first)
```

### Available Enums

| Enum | Values |
|---|---|
| `ServerResponseEnum` | HTTP response codes |
| `AlertTypeEnum` | success / warning / error / info |
| `UserStatusEnum` | active / inactive / pending |
| `AdminRoleEnum` | Role identifiers |
| `DietPlanStatusEnum` | active / inactive / expired |
| `DietTypeEnum` | Diet type codes |
| `MediaFolderEnum` | Upload folder paths |
| `FileTypeEnum` | Allowed file types |
| `TaxTypeEnum` | GST / VAT / NO_TAX |
| `TaxMode` | DOMESTIC_GST / EXPORT_OF_SERVICE / VAT / NO_TAX |
| `TransactionType` | plan / product / renewal |

### Available Interfaces

`IApiResponse`, `IPaginatedResponse`, `IUser`, `IAdminUser`, `IMember`, `IDropdownItem`, `IBreadcrumbItem`, `INavItem`, `IFileModel`, `ITableColumn`, `InvoiceDocument`, `MemberInfo`

### Available Utils

| Util | Methods |
|---|---|
| `ValidationUtil` | `isValidEmail`, `isValidPhone`, `isValidPAN`, `isValidGST` |
| `CommonUtil` | `formatDate`, `formatCurrency`, `formatAddress` |
| `CryptoUtil` | `toBase64`, `fromBase64`, `generateUUID`, `hashString` |

### Import Path

```typescript
import { IApiResponse, TaxMode, ValidationUtil } from '@eatfit247-shared-lib';
```

**Build first** — all downstream projects import from `dist/`:
```bash
cd shared-library && npm run build
```

---

## Infrastructure & Docker

### Infra Directory

```
infra/
├── docker-compose.yml          # Orchestrates all services
├── Dockerfile.server           # NestJS API image (both admin-api + public-api)
├── Dockerfile.admin            # Admin Angular SPA + Nginx
├── Dockerfile.client           # Public web (legacy, commented out in compose)
├── Dockerfile.client1          # Public web SSR (eatfit247-web-1)
├── Dockerfile.setup            # Init/setup container
├── nginx.conf                  # Base Nginx config
├── nginx-admin.conf            # Admin Nginx reverse proxy
├── nginx-client.conf           # Public web Nginx (legacy)
├── nginx-client1.conf          # Public web-1 Nginx
├── eatfit24by7.conf            # Nginx vhost (legacy client)
├── eatfit24by7-admin.conf      # Nginx vhost (admin)
├── eatfit24by71.conf           # Nginx vhost (web-1)
├── main.env.example            # Environment variable template
├── sample.main.env             # Sample env file
├── init-media-dirs.sh          # Media directory init script
└── backup-media.sh             # Media backup script
```

### Docker Compose Services

| Service | Image | Container | Port |
|---|---|---|---|
| `public-api` | `eatfit-server` | `eatfit-public-api` | `3000:3000` |
| `admin-api` | `eatfit-server` | `eatfit-admin-api` | `3001:3001` |
| `admin-web` | `eatfit-admin` | `eatfit-admin-web` | `8080:443` |
| `client-web-1` | `eatfit-client-1` | `eatfit-client-web-1` | `443:443` |

Both API services share the same `eatfit-server` image; the `command` field selects which app to run.

**Shared volume**: `assets` (named Docker volume) + `media-files` path mount for persistent uploads.

---

## Development Setup

### Prerequisites

- Node.js 22+, npm 11+
- PostgreSQL (running externally)
- Redis (running externally, for caching)

### 1. Environment Files

```bash
cp server_1/.env.example server_1/.env
cp infra/main.env.example infra/main.env
```

Update with: database credentials, JWT secret, mail server config, Redis URL, payment gateway keys, Google API keys.

### 2. Build Shared Library (Required First)

```bash
cd shared-library
npm install
npm run build
```

### 3. Backend API

```bash
cd server_1
npm install
npm run start       # starts both admin-api (3001) and public-api (3000)
# or individually:
npm run start:admin
npm run start:public
```

### 4. Admin CMS

```bash
cd eatfit247-admin
npm install
npm start           # http://localhost:4200 → proxies to :3001
```

### 5. Public Website

```bash
cd eatfit247-web-1
npm install
npm start           # http://localhost:4200 → proxies to :3000
```

### Nx Commands (server\_1 / eatfit247-admin)

```bash
nx build admin-api
nx build public-api
nx build core
nx build platform
nx graph            # visualise dependency graph

# Generators (preferred over manual creation)
nx g feature-module blog
nx g master-table blood-sugar
```

### Testing

```bash
# Backend
cd server_1
npm run test
npm run test:e2e
npm run test:cov

# Admin
cd eatfit247-admin
npm test
npm run e2e         # Playwright
```

---

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Navigate to infra directory
cd infra

# Build and start all services
docker compose up -d

# Verify services are running
docker ps

# Check health
curl http://localhost:3000/api/v2/public/health
curl http://localhost:3001/api/v2/admin/health

# Stop all services
docker compose down
```

### Access Points
- **Admin Panel**: https://localhost:8080
- **Public Website**: https://localhost:443
- **Public API**: http://localhost:3000
- **Admin API**: http://localhost:3001

#### Docker For EatFit247

Note: the Following commands should be executed from root of the project.

For building Server image

```shell
docker build . -f ./infra/Dockerfile.server -t eatfit-server
```

For building admin panel image

```shell
docker build . -f ./infra/Dockerfile.admin -t eatfit-admin
```

For building website image

```shell
docker build . -f ./infra/Dockerfile.client -t eatfit-client
```

### Docker build images
```shell
docker compose -f ./infra/docker-compose.yml build --no-cache
```

### Docker container up
```shell
docker compose -f ./infra/docker-compose.yml up -d
```

### Docker container down
```shell
docker compose -f ./infra/docker-compose.yml down
```

#### Docker run
```shell
docker run  [CONTAINER_NAME] sleep infinity
```
#### List docker containers list
```shell
docker ps -a
```

#### Go inside docker image
```shell
docker exec -it [CONTAINER_NAME] bash
```

Note: Ensure that you have .env file created in infra folder with ENV variable defined
For running all Servers

### Docker images
```shell
docker images # list images
```

### Delete all images
```shell
docker rmi [IMAGE_ID]
```
### Delete unused images
```shell
docker system prune
```

### Delete all containers including its volumes use
```shell
docker rm -vf $(docker ps -aq)
```

### logs all containers
```shell
docker logs [Container_NAME]
```

---

## Universal Invoice System

A single invoice format supporting all tax regimes and output targets.

### Supported Tax Modes

| TaxMode | Tax Rows | QR Code | Use Case |
|---|---|---|---|
| `DOMESTIC_GST` | CGST/SGST or IGST | Yes | India domestic |
| `EXPORT_OF_SERVICE` | GST 0% | No | India LUT export |
| `VAT` | VAT | No | UAE / VAT countries |
| `RCM_IMPORT_SERVICE` | None | No | Reverse charge |
| `NO_TAX` | None | No | USA / no-tax countries |

### Data Flow

```
Payment Entity
    ↓
mapPaymentToInvoiceDocument()  (shared-library)
    ↓
InvoiceDocument  (canonical JSON)
    ↓
    ├─→ InvoicePdfService    → PDF Buffer (Puppeteer)
    ├─→ Admin UI Component   → HTML Preview
    └─→ EmailNotificationService → PDF attachment
```

### Key Principle

Tax is **pre-calculated and stored** in the payment record. The mapper only transforms data — no tax calculation at invoice time.

### QR Code (Indian GST invoices only)

QR code enabled when `taxType === GST` AND `taxMode === DOMESTIC_GST`. Encodes: supplier GSTIN, invoice number, invoice date, total value, tax amount.

---

## Security Architecture

### Token Management

- **Access Token**: In-memory only (never localStorage), short-lived JWT
- **Refresh Token**: HttpOnly + Secure cookie (server-managed), long-lived
- **Token Rotation**: New refresh token issued on every refresh call
- **Revocation**: DB-backed refresh token invalidation on logout
- **CSRF Protection**: `SameSite` cookie attribute

### Other Security Measures

- `Helmet` — HTTP security headers
- `bcrypt` — password hashing
- Google reCAPTCHA Enterprise — form/checkout protection via `RecaptchaGuard`
- Rate limiting — `@nestjs/throttler`
- CASL — per-resource admin permission checks
- AES-256-CBC — checkout token encryption (`CryptoUtil`)

---

## Contributing

1. Follow the layered architecture — dependencies only flow upward in `server_1`
2. Never import between sibling feature modules in `server_1`
3. Use shared components (`DataTableComponent`, etc.) in admin — non-negotiable
4. All UI must use design tokens — no hardcoded colors
5. Build `shared-library` before running any other project
6. Run `nx graph` to verify no circular dependencies before PR
7. Use `nx g feature-module` / `nx g master-table` generators — no manual module creation

## License

MIT License — EatFit247 (https://eatfit247.com)
