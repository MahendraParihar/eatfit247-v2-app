# EatFit247 Shared Library

Shared library for EatFit247 applications providing common interfaces, enums, and utilities.

## Structure

```
shared-library/
├── src/
│   ├── base.interface.ts    # Base interfaces
│   ├── core/                # Core common interfaces
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

In `eatfit247-admin` or `server` package.json:

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

