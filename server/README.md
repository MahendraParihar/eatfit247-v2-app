# Eatfit247 Server

NestJS backend API server for Eatfit247 application.

## Structure

```
server/
├── apps/
│   ├── admin-api/          # Admin API application
│   │   └── src/
│   │       ├── app.module.ts
│   │       ├── app.controller.ts
│   │       └── main.ts
│   └── public-api/         # Public API application
│       └── src/
│           ├── app.module.ts
│           ├── app.controller.ts
│           └── main.ts
├── libs/
│   ├── common/             # Common library (shared across modules)
│   │   └── src/
│   │       ├── auth/       # Authentication (JWT, guards, decorators)
│   │       ├── common/     # Common services and DTOs
│   │       ├── error-handler/  # Global exception filters
│   │       ├── filters/    # Validation filters
│   │       └── utils/     # Utility functions
│   └── modules/            # Feature modules
│       ├── admin-user/     # Admin user management
│       ├── assessment-master/  # Assessment master data
│       ├── auth/           # Authentication module
│       ├── banner/         # Banner management
│       ├── blogs/          # Blog management
│       ├── call-logs/      # Call logs management
│       ├── diet-template/  # Diet template management
│       ├── email/          # Email notification service
│       ├── faq/           # FAQ management
│       ├── franchise/     # Franchise management
│       ├── issues/        # Issue category/status management
│       ├── locations/     # Location management
│       ├── lovs/          # List of values (LOVs)
│       ├── member/        # Member management (see below)
│       ├── member-testimonial/  # Member testimonials
│       ├── pages/         # Legal pages
│       ├── payment/      # Payment management
│       ├── pocket-guide/ # Pocket guide management
│       ├── press-media/  # Press & media management
│       ├── program-plan/ # Program plan management
│       ├── recipe/       # Recipe management
│       ├── referrer/     # Referrer management
│       └── reports/     # Reports module
├── src/                   # Root application (legacy)
│   ├── app.module.ts
│   ├── app.controller.ts
│   ├── app.service.ts
│   └── main.ts
├── package.json
├── tsconfig.json
├── nest-cli.json
└── README.md
```

## Module Structure

Each module follows a consistent structure:

```
module-name/
├── src/
│   ├── controllers/
│   │   ├── admin/        # Admin-only endpoints
│   │   └── public/       # Public endpoints
│   ├── services/          # Business logic
│   ├── dto/              # Data Transfer Objects
│   ├── models/            # Sequelize models
│   └── module-name.module.ts
└── index.ts
```

## Member Module Structure

The member module has been split into domain-specific controllers for better organization:

### Controllers

- **`MemberController`** - Basic CRUD operations
  - `GET /member/list` - List members
  - `GET /member/manage/:id` - Get member by ID
  - `POST /member/manage` - Create member
  - `PUT /member/manage/:id` - Update member
  - `PATCH /member/update-status/:id` - Update member status

- **`MemberPocketGuideController`** - Member pocket guide management
  - `GET /member/:id/pocket-guide` - Get pocket guides for member
  - `GET /member/:id/pocket-guide/list` - Get all pocket guides with selection status
  - `PUT /member/:id/pocket-guide/manage` - Manage pocket guide assignments

- **`MemberHealthIssueController`** - Member health issues management
  - `GET /member/:id/health-issues` - Get health issues for member
  - `GET /member/:id/health-issues/list` - Get all health issues with selection status
  - `PUT /member/:id/health-issues/manage` - Manage health issue assignments

- **`MemberBodyStatsController`** - Member body stats (health parameter logs)
  - `GET /member/:id/health-parameter-logs` - Get health parameter logs
  - `GET /member/:id/health-parameter-logs/master-data` - Get master data (parameters & units)
  - `POST /member/:id/health-parameter-logs` - Create health parameter log
  - `PUT /member/:id/health-parameter-logs/:logId` - Update health parameter log

- **`MemberIssueController`** - Member issues and responses
  - `GET /member/issues-master` - Get issue master data (categories, statuses)
  - `GET /member/:id/issues` - Get issues for member
  - `POST /member/:id/issues` - Create issue
  - `PUT /member/:id/issues/:issueId` - Update issue
  - `GET /member/:id/issues/:issueId/responses` - Get issue responses
  - `POST /member/:id/issues/:issueId/responses` - Create response
  - `POST /member/:id/issues/:issueId/mark-solved` - Mark issue as solved

- **`MemberAssessmentController`** - Member assessment
  - `GET /member/:id/assessment` - Get assessment
  - `PUT /member/:id/assessment` - Update assessment

- **`MemberCallLogsController`** - Member call logs
  - `GET /member/:id/call-logs` - Get call logs for member

- **`MemberPaymentHistoryController`** - Member payment history (placeholder)
- **`MemberDietPlanController`** - Member diet plan (placeholder)
- **`MemberDashboardController`** - Member dashboard (placeholder)

### Services

- `MemberService` - Core member CRUD operations
- `MemberPocketGuideService` - Pocket guide assignment logic
- `MemberHealthIssueService` - Health issue assignment logic
- `MemberHealthParameterLogsService` - Health parameter logs management
- `MemberIssueService` - Issue management
- `MemberIssueResponseService` - Issue response management
- `MemberAssessmentService` - Assessment management
- `MemberCallLogsService` - Call logs retrieval

## Development

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

### Install dependencies

```bash
npm install
```

### Environment Setup

Create a `.env` file in the root directory based on `.env.example`:

```bash
cp .env.example .env
```

### Required Environment Variables

- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name
- `DB_HOST` - Database host (e.g., localhost)
- `DB_PORT` - Database port (default: 5432)
- `JWT_SECRET` - Secret key for JWT token signing
- `ASSET_PATH` - Path to static assets directory

### Optional Environment Variables

- `DB_SCHEMA` - Database schema (default: public)
- `JWT_REFRESH_SECRET` - Refresh token secret (default: JWT_SECRET + '_refresh')
- `TOKEN_EXPIRATION` - Access token expiration (default: 15m)
- `REFRESH_TOKEN_TIME` - Refresh token expiration (default: 7d)
- `MAX_LOGIN_ATTEMPTS` - Maximum login attempts (default: 5)
- `LOCKOUT_DURATION_MINUTES` - Account lockout duration (default: 30)
- `PORT` - Server port (default: 3000)
- `DB_LOGGING` - Enable database query logging (default: false)

### Run Development Server

#### Admin API
```bash
npm run start:dev:admin
```

#### Public API
```bash
npm run start:dev:public
```

#### Root Application (Legacy)
```bash
npm run start:dev
```

Server will run on `http://localhost:3000` with API prefix `/api/v1`

### Build

```bash
npm run build
```

### Run Production

```bash
npm run start:prod
```

## API Structure

All endpoints are prefixed with `/api/v1`:

- **Admin API**: Protected endpoints requiring JWT authentication
- **Public API**: Public endpoints (no authentication required)

### Authentication

Most admin endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <token>
```

### Common Response Format

```typescript
{
  success: boolean;
  data: T;
  message?: string;
}
```

## Shared Library

This project uses `eatfit247-shared-lib` for common interfaces and utilities:

```typescript
import { 
  IResponse, 
  IDropdownItem, 
  ITableList,
  IMember,
  IManageMember,
  // ... other interfaces
} from 'eatfit247-shared-lib';
```

## Common Library (`@server/common`)

The common library provides shared functionality:

```typescript
import { 
  CommonModule,
  JwtAuthGuard,
  CurrentUser,
  RequestedIp,
  BasicSearchDto,
  Env,
  CryptoUtil,
  CommonFunctionsUtil
} from '@server/common';
```

### Features

- **Authentication**: JWT strategy, guards, and decorators
- **Database**: Sequelize configuration and model registry
- **Error Handling**: Global exception filters
- **Validation**: Validation filters and DTOs
- **Utilities**: Crypto, environment values, common functions
- **Services**: Email, currency, address, country, state services

## Database

The application uses PostgreSQL with Sequelize ORM. Models are registered in the `CommonModule` and each module registers its models via `SequelizeModule.forFeature()`.

### Model Registration

Models with `@Scopes` decorator must be registered in `CommonModule.forRoot()` for scopes to work properly.

## Code Style

- TypeScript strict mode enabled
- ESLint for linting
- Prettier for code formatting
- Follow NestJS conventions

## Testing

```bash
npm run test
```

## Contributing

1. Follow the module structure pattern
2. Use domain-specific controllers for large modules
3. Register models in the model registry
4. Use DTOs for validation
5. Follow TypeScript best practices
6. Write meaningful commit messages
