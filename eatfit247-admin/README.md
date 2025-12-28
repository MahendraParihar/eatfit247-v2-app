# EatFit247 Admin

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
│   │   │   ├── login/
│   │   │   ├── forgot-password/
│   │   │   └── reset-password/
│   │   ├── services/           # App-level services
│   │   │   └── theme.service.ts
│   │   ├── app.routes.ts      # Root routing configuration
│   │   ├── app-module.ts      # Root module
│   │   └── page-title.strategy.ts
│   ├── styles/                # Global styles & design system
│   │   ├── _design-tokens.scss    # Material 3 design tokens
│   │   ├── _status-tokens.scss    # Status colors (success/warning/error/info)
│   │   └── _theme.scss            # Material 3 theme configuration
│   ├── environments/          # Environment configurations
│   ├── index.html
│   ├── main.ts               # Application entry point
│   └── styles.scss           # Global stylesheet
├── libs/
│   ├── core/                 # Core library
│   │   └── src/lib/
│   │       ├── constants/    # App constants
│   │       ├── enums/        # Enumerations
│   │       ├── guards/       # Route guards
│   │       │   ├── auth.guard.ts
│   │       │   └── login.guard.ts
│   │       ├── interceptors/ # HTTP interceptors
│   │       │   ├── auth.interceptor.ts
│   │       │   └── http-error.interceptor.ts
│   │       ├── interfaces/   # TypeScript interfaces
│   │       ├── models/       # Data models
│   │       └── services/     # Core services
│   │           ├── auth.service.ts
│   │           ├── http.service.ts
│   │           └── ...
│   ├── shared-ui/            # Shared UI components library
│   │   └── src/lib/
│   │       ├── address-form/      # Address form component
│   │       ├── alert-dialog/      # Alert dialog component
│   │       ├── confirmation-menu/ # Confirmation menu component
│   │       ├── data-table/        # Data table component (reusable)
│   │       ├── empty-state/       # Empty state component
│   │       ├── img/               # Image component
│   │       ├── input-error/       # Input error component
│   │       ├── layout/            # Base layout component
│   │       ├── loader/            # Loading spinner component
│   │       ├── seo-form/          # SEO form component
│   │       ├── social-link/       # Social link form component
│   │       ├── upload-form/       # File upload component
│   │       ├── warning-dialog/    # Warning dialog component
│   │       └── utils/             # Utility functions
│   │           ├── table-formatters.ts
│   │           └── validation.util.ts
│   └── admin/                # Admin feature modules
│       ├── admin-user/       # Admin user management
│       ├── blogs/            # Blog management
│       ├── call-logs/        # Call logs management
│       ├── diet-template/    # Diet template management
│       ├── faq/             # FAQ management
│       ├── franchise/       # Franchise management
│       ├── issues/          # Issue management
│       ├── lov-master/      # List of Values (LOV) master
│       ├── media-press/     # Media & press management
│       ├── members/         # Member management (see below)
│       ├── pocket-guide/    # Pocket guide management
│       ├── program-plan/    # Program plan management
│       ├── programs/        # Program management
│       ├── recipes/         # Recipe management
│       └── referrer/       # Referrer management
├── public/                  # Static assets
├── e2e/                     # End-to-end tests
├── angular.json             # Angular CLI configuration
├── nx.json                  # Nx configuration
├── tsconfig.base.json       # TypeScript base configuration
├── package.json
└── README.md
```

## Admin Module Structure

Each admin module follows a consistent structure:

```
module-name/
├── src/
│   ├── lib/
│   │   ├── api.service.ts          # API service for backend communication
│   │   ├── module-name.component.ts # Main listing component
│   │   ├── module-name.html        # Main template
│   │   ├── module-name.scss        # Main styles
│   │   ├── lib.routes.ts           # Module routes
│   │   └── manage/                 # Manage/create/edit components
│   │       ├── manage-module-name.component.ts
│   │       ├── manage-module-name.html
│   │       └── manage-module-name.scss
│   └── index.ts                    # Module exports
├── tsconfig.json
├── tsconfig.lib.json
├── tsconfig.spec.json
├── project.json
└── jest.config.ts
```

## Members Module Structure

The members module is more complex with detailed views:

```
members/
├── src/lib/
│   ├── api.service.ts              # Members API service
│   ├── members.component.ts        # Members listing
│   ├── members.html
│   ├── members.scss
│   ├── lib.routes.ts              # Routes configuration
│   ├── manage/                    # Create/Edit member
│   │   ├── manage-member.component.ts
│   │   ├── manage-member.html
│   │   └── manage-member.scss
│   └── details/                   # Member details views
│       ├── member-details.component.ts
│       ├── dashboard/             # Member dashboard
│       ├── assessment/            # Member assessment
│       ├── pocket-guide/          # Pocket guide management
│       │   └── manage-member-pocket-guide/
│       ├── health-issues/         # Health issues management
│       │   └── manage-member-health-issue/
│       ├── health-parameter-logs/ # Body stats logs
│       │   └── manage-member-body-stats/
│       ├── call-logs/            # Call logs view
│       ├── issues/               # Member issues
│       │   └── issue-chat/       # Issue chat dialog
│       ├── payment-history/      # Payment history
│       └── diet-history/         # Diet history
```

### Members Module Routes

- `/members` - Members listing
- `/members/new` - Create new member
- `/members/edit/:id` - Edit member
- `/members/details/:id` - Member details (with child routes)
  - `/dashboard` - Member dashboard
  - `/assessment` - Member assessment
  - `/pocket-guide` - Pocket guide assignments
  - `/health-issues` - Health issue assignments
  - `/health-parameter-logs` - Body stats logs
  - `/call-logs` - Call logs
  - `/issues` - Member issues
  - `/payment-history` - Payment history
  - `/diet-history` - Diet history

## Path Aliases

The project uses TypeScript path aliases configured in `tsconfig.base.json`:

- `@core` → `libs/core/src/index.ts` - Core services and guards
- `@shared` → `libs/shared-ui/src/index.ts` - Shared UI components
- `@eatfit247-shared-lib` → `../shared-library/src/index.ts` - Shared interfaces
- `@env` → `src/environments/environment.ts` - Environment config
- Feature modules (e.g., `members`, `blogs`) → Direct imports from libs

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

### Run E2E Tests

```bash
npm run e2e
```

## Key Features

- **Material 3 Design System** - Modern Material Design implementation
- **Token-driven Theming** - Light/dark theme support via CSS custom properties
- **Shared Components** - Reusable UI components (`DataTableComponent`, `InputErrorComponent`, etc.)
- **API-driven Data Tables** - Consistent table implementation across modules
- **Authentication & Authorization** - JWT-based auth with route guards
- **Lazy Loading** - Feature modules loaded on demand
- **Standalone Components** - Modern Angular standalone component architecture
- **Reactive Forms** - Form validation and error handling
- **Dialog Management** - Modal dialogs for create/edit operations

## Shared Components

### DataTableComponent

Reusable data table component with:
- Sorting
- Pagination
- Search
- Custom columns and formatters
- Action buttons
- Footer configuration

```typescript
import { DataTableComponent, ITableConfig } from '@shared';

const tableConfig: ITableConfig<IMember> = {
  columns: [...],
  pageSize: 10,
  showPagination: true,
  showSearch: true,
};
```

### InputErrorComponent

Displays validation errors for form controls:

```html
<shared-ui-input-error [control]="formGroup.get('fieldName')"></shared-ui-input-error>
```

### EmptyStateComponent

Shows empty state messages:

```html
<shared-ui-empty-state [type]="EmptyStateType.MEMBERS"></shared-ui-empty-state>
```

### LoaderComponent

Loading spinner:

```html
<shared-ui-loader></shared-ui-loader>
```

## API Services Pattern

Each module has an API service extending `ApiBaseService`:

```typescript
import { ApiBaseService, HttpService } from '@core';
import { IResponse, ITableList } from '@eatfit247-shared-lib';

@Injectable({ providedIn: 'root' })
export class MembersApiService extends ApiBaseService {
  private readonly endpoint = '/member';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  async getList(params?: any): Promise<ITableList<IMember>> {
    const res = await this.httpService.get<IResponse<ITableList<IMember>>>(
      `${this.endpoint}/list`,
      { params }
    );
    return res.data as ITableList<IMember>;
  }
}
```

## Authentication Flow

1. User navigates to protected route
2. `AuthGuard` checks for valid JWT token
3. If no token, redirects to `/login`
4. `AuthInterceptor` adds token to all API requests
5. `HttpErrorInterceptor` handles 401 errors and redirects to login

## Design System Reference

See `DESIGN_SYSTEM.md` for complete design system documentation including:

- Design tokens
- Color system
- Typography
- Spacing
- Component guidelines
- Theme configuration

## Code Style

- TypeScript strict mode enabled
- ESLint for linting
- Prettier for code formatting
- Follow Angular style guide
- Use standalone components
- Use reactive forms
- Follow Material 3 guidelines

## Contributing

1. Follow the module structure pattern
2. Use shared components (`DataTableComponent`, `InputErrorComponent`, etc.)
3. Follow the design system (NO hardcoded colors)
4. Use path aliases for imports
5. Write meaningful commit messages
6. Add tests for new features
7. Update documentation as needed

## Environment Configuration

Environment files are located in `src/environments/`:

- `environment.ts` - Development environment
- `environment.prod.ts` - Production environment

Configure API endpoints and other environment-specific values here.

## Dependencies

Key dependencies:

- `@angular/*` - Angular framework
- `@angular/material` - Material Design components
- `@angular/cdk` - Component Dev Kit
- `rxjs` - Reactive programming
- `@eatfit247-shared-lib` - Shared interfaces and types
- `moment` - Date handling (via `@angular/material-moment-adapter`)
