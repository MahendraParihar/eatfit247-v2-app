# Eatfit247 Server

NestJS backend API server for Eatfit247 application.

## Structure

```
server/
├── src/
│   ├── app.module.ts      # Root application module
│   ├── app.controller.ts  # Root controller
│   ├── app.service.ts     # Root service
│   ├── main.ts            # Application entry point
│   ├── modules/           # Feature modules
│   ├── core/              # Core modules (database, etc.)
│   ├── common-dto/        # Common DTOs
│   ├── filters/           # Exception filters
│   ├── interceptors/      # HTTP interceptors
│   └── util/              # Utility functions
├── dist/                  # Compiled output
├── package.json
├── tsconfig.json
├── nest-cli.json
└── README.md
```

## Development

### Install dependencies

```bash
npm install
```

### Run development server

```bash
npm run start:dev
```

Server will run on `http://localhost:3000`

### Build

```bash
npm run build
```

### Run production

```bash
npm run start:prod
```

## Shared Library

This project uses `eatfit247-shared-lib` for common interfaces and utilities:

```typescript
import { IResponse, IDropdownItem, CommonUtil } from 'eatfit247-shared-lib';
```

## Environment Variables

Create a `.env` file in the root directory based on `.env.example`:

```bash
cp .env.example .env
```

Then edit `.env` and set the following required variables:

### Required Variables

- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name
- `DB_HOST` - Database host (e.g., localhost)
- `DB_PORT` - Database port (default: 5432)
- `JWT_SECRET` - Secret key for JWT token signing
- `ASSET_PATH` - Path to static assets directory

### Optional Variables (with defaults)

- `DB_SCHEMA` - Database schema (default: public)
- `JWT_REFRESH_SECRET` - Refresh token secret (default: JWT_SECRET + '_refresh')
- `TOKEN_EXPIRATION` - Access token expiration (default: 15m)
- `REFRESH_TOKEN_TIME` - Refresh token expiration (default: 7d)
- `MAX_LOGIN_ATTEMPTS` - Maximum login attempts (default: 5)
- `LOCKOUT_DURATION_MINUTES` - Account lockout duration (default: 30)
- `PORT` - Server port (default: 3000)
- `DB_LOGGING` - Enable database query logging (default: false)

