# Common Library

Common library for server providing shared modules, services, and utilities.

## Structure

```
libs/common/
├── src/
│   ├── lib/
│   │   ├── auth/              # Authentication (JWT, guards, decorators)
│   │   ├── common/            # Common services and DTOs
│   │   ├── error-handler/     # Global exception filters
│   │   ├── filters/           # Validation filters
│   │   ├── utils/             # Utility functions
│   │   └── common.module.ts   # Common module
│   └── index.ts               # Main export
├── package.json
└── README.md
```

## Usage

Import from the common library:

```typescript
import { CommonModule, JwtAuthGuard, CurrentUser, Env, CryptoUtil } from '@server/common';
```

## Features

- **Authentication**: JWT strategy, guards, and decorators
- **Database**: Sequelize configuration
- **Error Handling**: Global exception filters
- **Validation**: Validation filters and exceptions
- **Utilities**: Crypto, environment values, common functions
- **DTOs**: Common DTOs for table lists, status changes, etc.

