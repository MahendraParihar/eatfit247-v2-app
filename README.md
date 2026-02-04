# EatFit247 v2 - Full Stack Monorepo

A comprehensive monorepo containing CMS admin panel, backend API, web application, and shared libraries for EatFit247's digital ecosystem.

## 🏗️ Project Structure

```
eatfit247-v2-app/
├── eatfit247-web/          # Angular Material M3 Web App
├── eatfit247-admin/        # Angular Material Admin Panel (Nx Monorepo)
├── server_1/               # NestJS Backend API (Nx Monorepo)
├── shared-library/          # Shared TypeScript Library
├── infra/                  # Docker & Infrastructure
└── README.md               # This file
```

---

# Table of Contents

1. [Project Overview](#project-overview)
2. [EatFit247 Web Application](#eatfit247-web-application)
3. [EatFit247 Admin Panel](#eatfit247-admin-panel)
4. [Server Backend (server_1)](#server-backend-server_1)
5. [Shared Library](#shared-library)
6. [Universal Invoice System](#universal-invoice-system)
7. [Development Setup](#development-setup)
8. [Documentation Index](#documentation-index)

---

# Project Overview

## 🚀 Applications

| Project | Type | Technology | Port | Purpose |
|---------|------|------------|------|---------|
| **eatfit247-web** | Frontend | Angular 20+ Material M3 | 4200 | Public Web App |
| **eatfit247-admin** | Frontend | Angular Material 3 (Nx) | 4200 | Admin CMS Panel |
| **server_1** | Backend | NestJS + Sequelize (Nx) | 8001 | RESTful API |
| **shared-library** | Library | TypeScript | N/A | Shared Resources |

---

# EatFit247 Web Application

Modern web application built with Angular 20+ and Material Design 3 (M3) using standalone components architecture.

## 🎨 Features

- ✅ **Angular 20+** with standalone components
- ✅ **Angular Material M3** with custom theming
- ✅ **Material Design 3** color system
- ✅ **Shared Library** integration (`shared-library`)
- ✅ **TypeScript 5.9+** for type safety
- ✅ **SCSS** for styling
- ✅ **Proxy configuration** for API calls
- ✅ **Production-ready** build configuration

## 🏗️ Architecture

### Standalone Components
This project uses Angular's modern standalone components architecture (no NgModules).

### Material M3 Theme
Custom Material Design 3 theme configured in `src/theme.scss`:
- **Primary Color**: Teal (#006874)
- **Secondary Color**: Blue-grey  
- **Tertiary Color**: Deep blue
- **Light & Dark** mode support
- **Custom elevation** levels
- **Shape tokens** (corner radius)

## 🚀 Quick Start

### Prerequisites
- Node.js 22+
- npm 11+

### Install Dependencies
```bash
cd eatfit247-web
npm install
```

### Development Server
```bash
# Start with API proxy (recommended)
npm start

# Start without proxy
npm run start:no-proxy
```

Navigate to `http://localhost:4200/`

### Build for Production
```bash
npm run build:prod
```

Build artifacts will be in the `dist/` directory.

## 📁 Project Structure

```
eatfit247-web/
├── src/
│   ├── app/
│   │   ├── app.ts              # Root component
│   │   ├── app.config.ts       # Application configuration
│   │   ├── app.routes.ts       # Route definitions
│   │   ├── app.html            # Template
│   │   └── app.scss            # Styles
│   ├── environments/
│   │   ├── environment.ts      # Development config
│   │   └── environment.prod.ts # Production config
│   ├── assets/
│   │   ├── images/             # Image assets
│   │   │   ├── products/       # Product images
│   │   │   ├── programs/       # Program images
│   │   │   └── social/         # Social media icons
│   │   └── README.md           # Assets documentation
│   ├── index.html              # Main HTML
│   ├── main.ts                 # Bootstrap
│   ├── styles.scss             # Global styles
│   └── theme.scss              # Material M3 theme
├── public/
│   └── favicon.ico
├── angular.json                # Angular CLI config
├── package.json
├── proxy.conf.json             # API proxy configuration
└── tsconfig.json
```

## 🎨 Material M3 Usage

### Importing Material Components

```typescript
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatIconModule],
  template: `
    <mat-card>
      <mat-card-content>
        <button mat-raised-button color="primary">
          <mat-icon>home</mat-icon>
          Click Me
        </button>
      </mat-card-content>
    </mat-card>
  `
})
export class ExampleComponent {}
```

## 📚 Using Shared Library

### Import from shared-library

```typescript
import { 
  ServerResponseEnum,
  IApiResponse,
  IUser,
  ValidationUtil,
  CommonUtil 
} from 'shared-library';

// Validate email
if (ValidationUtil.isValidEmail('user@example.com')) {
  // Valid email
}

// Format dates
const formatted = CommonUtil.formatDate(new Date());
```

## 🔌 API Integration

### Proxy Configuration

The `proxy.conf.json` routes API calls to the backend:

```json
{
  "/api/v1": {
    "target": "http://localhost:8001",
    "secure": false,
    "changeOrigin": true
  }
}
```

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Dev server with API proxy |
| `npm run start:no-proxy` | Dev server without proxy |
| `npm run build` | Development build |
| `npm run build:prod` | Production build |
| `npm test` | Run unit tests |
| `npm run watch` | Build in watch mode |

---

# EatFit247 Admin Panel

Angular-based admin application for EatFit247 platform built with Angular Material 3 and Nx monorepo.

## Design System

**⚠️ CRITICAL: All UI code must follow the design system.**

### Source of Truth:
1. **`DESIGN_SYSTEM.md`** (project root) - Primary documentation
2. Code comments

### Key Rules:
1. ✅ Use design tokens (CSS custom properties) - **NO hardcoded colors**
2. ✅ Follow Material 3 guidelines
3. ✅ Support both light and dark themes (class-based: `.light-theme` / `.dark-theme`)
4. ✅ Use shared components (e.g., `DataTableComponent`) - **NON-NEGOTIABLE**
5. ✅ Use status tokens for success/warning/error/info
6. ✅ WCAG 2.1 AA compliance required
7. ✅ Border radius: 0 for all components except buttons (12px)

## Project Structure

```
eatfit247-admin/
├── src/
│   ├── app/                    # Application root
│   │   ├── auth/              # Authentication pages
│   │   ├── services/           # App-level services
│   │   └── app.routes.ts      # Root routing configuration
│   ├── styles/                # Global styles & design system
│   └── environments/          # Environment configurations
├── libs/
│   ├── core/                 # Core library
│   │   └── src/lib/
│   │       ├── guards/       # Route guards
│   │       ├── interceptors/ # HTTP interceptors
│   │       └── services/     # Core services
│   ├── shared-ui/            # Shared UI components library
│   │   └── src/lib/
│   │       ├── data-table/        # Data table component
│   │       ├── alert-dialog/      # Alert dialog component
│   │       └── ...                # Other shared components
│   └── admin/                # Admin feature modules
│       ├── members/         # Member management
│       ├── blogs/            # Blog management
│       └── ...               # Other admin modules
├── angular.json             # Angular CLI configuration
├── nx.json                  # Nx configuration
└── package.json
```

## Design System Reference

### Material 3 Core Color Tokens

**Light Theme:**
- Primary: #fc2305
- Surface: #ffffff
- On-surface: #1c1b1f

**Dark Theme:**
- Primary: #ff5c47
- Surface: #121212
- On-surface: #e6e6e6

### Semantic Status Colors

**Light Theme:**
- Success: #1b8f5a
- Warning: #f29900
- Error: #d32f2f
- Info: #1976d2

**Dark Theme:**
- Success: #5dd8a0
- Warning: #ffb74d
- Error: #ef9a9a
- Info: #90caf9

## Development

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Angular CLI (optional, Nx handles builds)

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm start
# or
ng serve
```

Application will run on `http://localhost:4200`

### Build
```bash
npm run build
```

### Run Tests
```bash
npm test
```

## Key Features

- **Material 3 Design System** - Modern Material Design implementation
- **Token-driven Theming** - Light/dark theme support via CSS custom properties
- **Shared Components** - Reusable UI components (`DataTableComponent`, `InputErrorComponent`, etc.)
- **API-driven Data Tables** - Consistent table implementation across modules
- **Authentication & Authorization** - JWT-based auth with route guards
- **Lazy Loading** - Feature modules loaded on demand
- **Standalone Components** - Modern Angular standalone component architecture

## Shared Components

### DataTableComponent

Reusable data table component with:
- Sorting
- Pagination
- Search
- Custom columns and formatters
- Action buttons
- Footer configuration

### Authentication Flow

1. User navigates to protected route
2. `AuthGuard` checks for valid JWT token
3. If no token, redirects to `/login`
4. `AuthInterceptor` adds token to all API requests
5. `HttpErrorInterceptor` handles 401 errors and redirects to login

## Authentication & Security

### Token Management

- **Access Token**: In-memory only (not localStorage)
- **Refresh Token**: HttpOnly, Secure Cookie (server-side)
- **Token Rotation**: Enabled - new refresh token on each refresh
- **Automatic Refresh**: Handles 401 → refresh → retry flow

---

# Server Backend (server_1)

Backend architecture and development guide for the `server_1` NestJS backend project.

## Project Overview

* **Monorepo Tooling:** Nx
* **Framework:** NestJS
* **ORM:** Sequelize (sequelize-typescript)
* **Languages:** TypeScript
* **APIs:** REST

The project supports:
* Admin-facing APIs
* Public-facing APIs
* 70+ database tables
* Heavy JOIN usage
* Strict dependency boundaries

## Applications

```
apps/
├── admin-api    # Admin-facing APIs
└── public-api   # Public-facing APIs
```

### Responsibilities

* Apps are **thin shells**
* Apps wire modules together and configure global middleware
* Apps DO NOT contain business logic

## High-Level Architecture (MANDATORY)

The system follows a **strict layered architecture**:

```
shared-dto
   ↑
  core
   ↑
 platform
   ↑
 modules (features)
   ↑
 admin-only
   ↑
 apps
```

### Golden Rule

> **Dependencies may only flow UPWARD.**

Any downward or sideways dependency will break Nx builds.

## Libraries Overview

### shared-dto
- DTOs, Enums, Interfaces
- ❌ No NestJS, No Sequelize, No services
- ✅ Pure TypeScript

### core
- Database bootstrap (Sequelize `forRoot`)
- Authentication (JWT, guards)
- Interceptors, Filters, Config
- ❌ Must NOT import platform, modules, admin-only
- ❌ Must NOT register domain models

### platform
- Cross-domain infrastructure & master data
- Owns `mst_*` master tables
- Email templates, Labels, Error logging
- ✅ Can import core
- ❌ Must NOT import feature modules

### feature modules (`libs/modules/*`)
- Business domains
- Each feature module owns its models, services, controllers
- ❌ Feature must NOT import another feature
- ❌ Feature must NOT import admin-only
- ✅ Feature may import core, platform, shared-dto

### admin-only
- Admin-exclusive features
- Only `admin-api` may import admin-only modules
- Admin-only may depend on features/platform/core

## Sequelize JOIN STRATEGY (CRITICAL)

This project **supports FULL SQL JOINs** without circular dependencies.

### ❌ FORBIDDEN (causes Nx cycles)

```ts
import { MstAdminUser } from '@admin-only/admin-user';
```

**Why this works:**
* Sequelize resolves models by name at runtime
* Nx sees no TypeScript dependency
* JOINs remain single-query and performant

### Query Example

```ts
this.blogRepo.findAll({
  include: [{
    model: 'MstAdminUser',
    attributes: ['admin_user_id', 'name'],
  }],
});
```

## Generators (MANDATORY USAGE)

### Feature module
```bash
nx g feature-module blog
```

### Master table
```bash
nx g master-table blood-sugar
```

**Manual creation of modules is discouraged.**

## Validation Checklist (Before PR)

```bash
nx build core
nx build platform
nx build admin-api
nx build public-api
nx graph
```

PRs must show:
* No circular dependencies
* No forbidden imports

## SEO Data Seeding

The SEO module provides functionality to seed SEO metadata for website pages from a CSV file.

### Database Model

The SEO data is stored in the `mst_seo_pages` table with fields:
- `url` - The page URL path
- `meta_title` - Page title for SEO
- `meta_description` - Meta description
- `canonical_url` - Canonical URL
- `og_type`, `og_title`, `og_description`, `og_url` - Open Graph metadata
- `twitter_card` - Twitter card type

### Seeding Methods

**Method 1: Using the Admin API Endpoint**
```bash
curl -X POST http://localhost:8000/seo-page/seed \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "csvFilePath": "/path/to/eatfit24by7_seo_each_link_seed.csv"
  }'
```

**Method 2: Using the Standalone Script**
```bash
npx ts-node server_1/libs/modules/pages/src/scripts/run-seed.ts /path/to/eatfit24by7_seo_each_link_seed.csv
```

---

# Shared Library

Shared library for EatFit247 applications providing common interfaces, enums, and utilities.

## Structure

```
shared-library/
├── src/
│   ├── base.interface.ts    # Base interfaces
│   ├── core/                # Core common interfaces
│   │   └── invoice/         # Invoice system
│   ├── auth/                # Authentication interfaces
│   ├── enum/                # Enum definitions
│   ├── utils/               # Utility functions
│   └── index.ts             # Main export file
├── dist/                     # Compiled output
├── package.json
├── tsconfig.json
└── README.md
```

## Usage

### Build
```bash
npm run build
```

### Development (watch mode)
```bash
npm run dev
```

## Installation in other projects

In `eatfit247-admin` or `server_1` package.json:

```json
{
  "dependencies": {
    "eatfit247-shared-lib": "file:../shared-library"
  }
}
```

Then import:

```typescript
import { IResponse, ITableList, IAuthUser, FileTypeEnum } from '@eatfit247-shared-lib';
```

## Available Resources

**Enums**:
- ServerResponseEnum, AlertTypeEnum
- UserStatusEnum, AdminRoleEnum
- DietPlanStatusEnum, DietTypeEnum
- MediaFolderEnum, FileTypeEnum
- TaxTypeEnum, TaxMode, TransactionType

**Interfaces**:
- IApiResponse, IPaginatedResponse
- IUser, IAdminUser, IMember
- IDropdownItem, IBreadcrumbItem, INavItem
- IFileModel, ITableColumn
- InvoiceDocument, MemberInfo

**Utils**:
- ValidationUtil - Email, phone, PAN, GST validation
- CommonUtil - Date, currency, formatting utilities
- CryptoUtil - Base64, UUID, hashing

---

# Universal Invoice System

A universal, reusable invoice system that supports multiple tax regimes and formats.

## Features

- ✅ Single invoice format for all tax regimes
- ✅ Indian GST (with SAC/HSN and QR code)
- ✅ Export of Services (LUT)
- ✅ VAT countries (UAE)
- ✅ No-Tax countries (USA)
- ✅ Supports services and products
- ✅ Reusable for PDF, Admin UI preview, Email attachment
- ✅ QR code on Indian GST invoices

## Setup

### 1. Install Dependencies

```bash
# In server_1 directory
npm install qrcode
npm install --save-dev @types/qrcode
```

### 2. Build Shared Library

```bash
# In shared-library directory
npm run build

# Or from server_1
npm run build_shared_lib
```

### 3. Import and Use

```typescript
import { 
  mapPaymentToInvoiceDocument,
  InvoiceDocument,
  MemberInfo 
} from '@eatfit247-shared-lib';
import { InvoicePdfService } from '@server_1/platform';
import { TransactionType, TaxMode, TaxTypeEnum } from '@eatfit247-shared-lib';
```

## Architecture

```
Payment Entity
    ↓
Invoice Mapper (mapPaymentToInvoiceDocument)
    ↓
InvoiceDocument (Pure JSON)
    ↓
    ├─→ InvoicePdfService → PDF Buffer
    ├─→ Admin UI Component → HTML Preview
    └─→ Email Service → PDF Attachment
```

## Key Principles

1. **No Tax Calculation**: Tax is already calculated and stored in `paymentObj.tax`. The mapper only transforms data.
2. **Single Source of Truth**: `InvoiceDocument` is the canonical format used by all consumers.
3. **Conditional Rendering**: QR codes, SAC/HSN columns, and tax rows are conditionally rendered based on tax type and mode.

## Tax Mode Mapping

| TaxMode | Tax Rows | QR Code | Note |
|---------|----------|---------|------|
| `DOMESTIC_GST` | CGST/SGST or IGST | ✅ Yes | Standard Indian GST invoice |
| `EXPORT_OF_SERVICE` | GST 0% | ❌ No | LUT export invoice |
| `VAT` | VAT | ❌ No | UAE/VAT countries |
| `RCM_IMPORT_SERVICE` | None | ❌ No | Reverse charge mechanism |
| `NO_TAX` | None | ❌ No | USA/No-tax countries |

## QR Code Rules

QR code is **only** enabled when:
- `taxType === GST` AND
- `taxMode === DOMESTIC_GST`

QR code value includes:
- Supplier GSTIN
- Invoice number
- Invoice date
- Total invoice value
- Tax amount

---

# Development Setup

## 🔧 Environment Setup (Required First!)

### 1. Copy Environment Templates
```bash
cp server_1/.env.example server_1/.env
cp infra/main.env.example infra/main.env
```

### 2. Configure Environment Variables
Update environment files with your settings:
- Database credentials
- JWT secret key
- Mail server configuration
- Application paths

## 🚀 Quick Start

### 1. Shared Library (Build First!)
```bash
cd shared-library
npm install
npm run build
# Builds TypeScript library used by all projects
```

### 2. Backend API (NestJS)
```bash
cd server_1
npm install
npm run start:dev
# Runs on http://localhost:8001
```

### 3. Admin CMS (Angular Material)
```bash
cd eatfit247-admin
npm install
npm start
# Runs on http://localhost:4200
```

### 4. Web App (Angular Material M3)
```bash
cd eatfit247-web
npm install
npm start
# Runs on http://localhost:4200 with API proxy
```

**Note**: Build `shared-library` first as all projects depend on it!

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
curl http://localhost:8001/api/v1/health

# Stop all services
docker compose down
```

### Access Points
- **Frontend**: http://localhost:80
- **Backend API**: http://localhost:8001  
- **API via Proxy**: http://localhost:80/api/v1
- **Health Check**: http://localhost:8001/api/v1/health

## 🧪 Testing

### Backend Tests
```bash
cd server_1
npm run test
npm run test:e2e
npm run test:cov
```

### Frontend Tests
```bash
cd eatfit247-admin
npm test
npm run e2e
```

## 🛠️ Development Commands

### Angular CLI Commands
```bash
# Generate component
ng g c PATH/COMPONENT_NAME --standalone

# Generate module
ng g m PATH/MODULE_NAME --routing

# Build for production
ng build --configuration production
```

### NestJS CLI Commands
```bash
# Generate module
nest g module [PATH]/[MODULE_NAME]

# Generate controller
nest g controller [PATH]/[CONTROLLER_NAME]

# Generate service
nest g service [PATH]/[SERVICE_NAME]
```

### Nx Commands
```bash
# Generate feature module
nx g feature-module blog

# Generate master table
nx g master-table blood-sugar

# Build project
nx build admin-api

# Run tests
nx test admin-api
```

---

# Documentation Index

## Project Documentation

### EatFit247 Web
- Architecture: Standalone components, Material M3 theming
- Assets: Product images, program images, favicon setup
- API Integration: Proxy configuration, environment setup

### EatFit247 Admin
- Design System: Material 3 tokens, theme configuration
- Shared Components: DataTableComponent, InputErrorComponent, etc.
- Authentication: JWT-based auth with HttpOnly cookies, token rotation
- HTTP Service: Centralized HTTP operations with async/await

### Server Backend
- Architecture: Layered architecture with strict dependency rules
- Sequelize: String-based associations for JOINs without circular dependencies
- Generators: Feature modules and master tables
- SEO: Data seeding from CSV files

### Shared Library
- Interfaces: Common data structures
- Enums: Status codes, tax types, transaction types
- Utils: Validation, formatting, crypto utilities
- Invoice System: Universal invoice generation

## Security Documentation

### Token Management
- Access Token: In-memory only (not localStorage)
- Refresh Token: HttpOnly, Secure Cookie (server-side)
- Token Rotation: Enabled - new refresh token on each refresh
- Automatic Refresh: Handles 401 → refresh → retry flow

### Authentication Flow
- Login: Sets refresh token cookie, returns access token
- Refresh: Reads refresh token from cookie, issues new tokens
- Logout: Revokes refresh token and clears cookie
- CSRF Protection: SameSite cookie attribute

## Asset Management

### Web Application Assets
- Product Images: Located in `src/assets/images/products/`
- Program Images: Located in `src/assets/images/programs/`
- Social Icons: SVG format with brand colors
- Favicon: Multiple sizes for different devices

### Media Files
Media files are stored in persistent Docker volumes:
- Admin user files
- Blog images
- Diet plans
- Invoices
- Member documents
- Program files
- Recipe images

---

## 🤝 Contributing

1. Follow the architecture guidelines
2. Use shared components and design tokens
3. Follow the design system (NO hardcoded colors)
4. Write meaningful commit messages
5. Add tests for new features
6. Update documentation as needed

## 📄 License

This project is licensed under the MIT License.

## 👥 Team

- **Author**: [EatFit247](https://eatfit247.com)
- **Website**: [https://eatfit247.com](https://eatfit247.com)

## 🔗 Useful Links

- [Angular Documentation](https://angular.io/docs)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Docker Documentation](https://docs.docker.com/)
- [Angular Material](https://material.angular.io/)
- [Material Design 3](https://m3.material.io/)
- [Nx Documentation](https://nx.dev/)

---

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

### Docer images
```shell list 
docker images # list images
```

### Delete all images
```shell list
docker rmi [IMAGE_ID]
```
### Delete unused images
```shell list
docker system prune
```

### Delete all containers including its volumes use
```shell list
docker rm -vf $(docker ps -aq)
```

### logs all containers
```shell list 
docker logs [Container_NAME]
```

**Note**: This is a full-stack application with persistent media storage, comprehensive security measures, and production-ready Docker configuration. For detailed setup instructions, please refer to the documentation sections above.~~
