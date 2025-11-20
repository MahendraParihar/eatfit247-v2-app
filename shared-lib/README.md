# @eatfit247/shared-lib

Shared library containing common interfaces, enums, and utilities for all EatFit247 applications.

## Overview

This library provides shared resources used across:
- **eatfit247-cms** - Angular Material CMS admin panel
- **eatfit247-cms-api** - NestJS backend API
- **eatfit247-web** - Angular Material M3 web application

## Installation

The library is linked locally in all projects:

```json
{
  "dependencies": {
    "@eatfit247/shared-lib": "file:../shared-lib"
  }
}
```

## Structure

```
shared-lib/
├── src/
│   ├── enums/
│   │   ├── server-response.enum.ts   # API response codes
│   │   ├── user-status.enum.ts       # User/admin status & roles
│   │   ├── diet.enum.ts               # Diet plans & types
│   │   └── media.enum.ts              # Media folders & file types
│   ├── interfaces/
│   │   ├── api-response.interface.ts  # Standard API responses
│   │   ├── user.interface.ts          # User & admin interfaces
│   │   └── common.interface.ts        # Dropdown, breadcrumb, etc.
│   ├── utils/
│   │   ├── common.util.ts             # Date, currency, formatting
│   │   ├── validation.util.ts         # Email, phone, PAN, GST validation
│   │   └── crypto.util.ts             # Base64, UUID, hashing
│   └── index.ts                       # Main export file
├── dist/                              # Compiled JavaScript
├── package.json
└── tsconfig.json
```

## Usage

### In Angular Projects (eatfit247-cms, eatfit247-web)

```typescript
import { 
  ServerResponseEnum, 
  UserStatusEnum,
  IApiResponse,
  IUser,
  ValidationUtil,
  CommonUtil 
} from '@eatfit247/shared-lib';

// Use enums
if (response.code === ServerResponseEnum.SUCCESS) {
  // Handle success
}

// Use interfaces
const apiResponse: IApiResponse<IUser> = {
  code: 200,
  message: 'User fetched successfully',
  data: user
};

// Use utilities
if (ValidationUtil.isValidEmail(email)) {
  // Email is valid
}

const formattedDate = CommonUtil.formatDate(new Date());
const age = CommonUtil.calculateAge('1990-01-01');
```

### In NestJS Projects (eatfit247-cms-api)

```typescript
import { 
  ServerResponseEnum,
  IApiResponse,
  MediaFolderEnum 
} from '@eatfit247/shared-lib';

// In controllers
return {
  code: ServerResponseEnum.SUCCESS,
  message: 'Data retrieved successfully',
  data: result
} as IApiResponse;

// In services
const filePath = `${MediaFolderEnum.RECIPE}/file.jpg`;
```

## Available Enums

### ServerResponseEnum
- `SUCCESS` (200)
- `CREATED` (201)
- `ERROR` (400)
- `UNAUTHORIZED` (401)
- `NOT_FOUND` (404)
- `SERVER_ERROR` (500)

### UserStatusEnum
- `ACTIVE`
- `INACTIVE`
- `DELETED`
- `SUSPENDED`

### AdminRoleEnum
- `SUPER_ADMIN`
- `ADMIN`
- `NUTRITIONIST`
- `FRANCHISE_OWNER`
- `SUPPORT`

### DietPlanStatusEnum
- `PENDING`
- `APPROVED`
- `REJECTED`
- `DRAFT`

### MediaFolderEnum
- `ADMIN`, `MEMBER`, `RECIPE`, `BLOG`, `PROGRAM`
- `FRANCHISE`, `POCKET_GUIDE`, `DOWNLOADS`, etc.

## Available Interfaces

### IApiResponse<T>
Standard API response structure:
```typescript
{
  code: number;
  message: string;
  data: T | null;
  path?: string;
  timestamp?: string;
}
```

### IUser
Base user interface with common fields

### IAdminUser extends IUser
Admin user with role and permissions

### IMember extends IUser
Member/customer with health metrics

### IDropdownItem
Standard dropdown item structure

### IFileModel
File upload/download model

## Available Utilities

### ValidationUtil
- `isValidEmail(email)` - Email validation
- `isValidPhone(phone)` - Indian phone validation
- `isValidPassword(password)` - Password strength check
- `isValidPAN(pan)` - PAN card validation
- `isValidGST(gst)` - GST number validation
- `isValidAadhar(aadhar)` - Aadhar validation
- `isEmpty(value)` - Check for empty/whitespace
- `isNumeric(value)` - Check if numeric

### CommonUtil
- `formatDate(date)` - DD/MM/YYYY format
- `formatDateForAPI(date)` - YYYY-MM-DD format
- `formatCurrency(amount)` - Indian currency format
- `calculateAge(dob)` - Age calculation
- `generateRandomString(length)` - Random string
- `deepClone<T>(obj)` - Deep object clone
- `formatBytes(bytes)` - Human-readable file size
- `capitalizeFirst(str)` - Capitalize string
- `slugify(str)` - URL-friendly string

### CryptoUtil
- `encode(str)` - Base64 encode
- `decode(str)` - Base64 decode
- `simpleHash(str)` - Simple hash function
- `generateUUID()` - Generate UUID v4

## Development

### Build the library
```bash
cd shared-lib
npm run build
```

### Watch mode for development
```bash
cd shared-lib
npm run watch
```

### After making changes
1. Build the library: `npm run build`
2. Changes are automatically available in all dependent projects

## Adding New Resources

### Add a new enum
1. Create `src/enums/your-enum.enum.ts`
2. Export in `src/enums/index.ts`
3. Build the library

### Add a new interface
1. Create `src/interfaces/your-interface.interface.ts`
2. Export in `src/interfaces/index.ts`
3. Build the library

### Add a new utility
1. Create `src/utils/your-util.util.ts`
2. Export in `src/utils/index.ts`
3. Build the library

## Best Practices

1. **Type Safety**: Always define proper TypeScript types
2. **Documentation**: Add JSDoc comments for all exports
3. **Naming**: Use descriptive names with appropriate suffixes
   - Enums: `SomethingEnum`
   - Interfaces: `ISomething`
   - Utils: `SomethingUtil`
4. **Versioning**: Update version in package.json for breaking changes
5. **Testing**: Test in all three projects before committing

## Projects Using This Library

| Project | Type | Description |
|---------|------|-------------|
| eatfit247-cms | Angular | Admin CMS panel |
| eatfit247-cms-api | NestJS | Backend API |
| eatfit247-web | Angular M3 | Public web application |

## Version

Current version: **1.0.0**

## License

MIT © EatFit247
