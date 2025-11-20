# Using shared-lib in eatfit247-web

This document demonstrates how the `shared-lib` is integrated and used throughout the eatfit247-web application.

## 📦 Installation

The shared library is already configured in `package.json`:

```json
{
  "dependencies": {
    "shared-lib": "file:../shared-lib"
  }
}
```

**Important**: Always build the shared library before using it:

```bash
cd ../shared-lib
npm run build
cd ../eatfit247-web
npm install
```

## 🎯 Usage Examples

### 1. API Service (`src/app/services/api.service.ts`)

Demonstrates using shared library interfaces and enums for API calls:

```typescript
import {
  IApiResponse,
  ILoginRequest,
  ILoginResponse,
  IUser,
  ServerResponseEnum,
} from 'shared-lib';

@Injectable({ providedIn: 'root' })
export class ApiService {
  login(credentials: ILoginRequest): Observable<IApiResponse<ILoginResponse>> {
    return this.http.post<IApiResponse<ILoginResponse>>(
      `${this.apiUrl}/account/sign-in`,
      credentials
    );
  }

  isSuccessResponse<T>(response: IApiResponse<T>): boolean {
    return response.code === ServerResponseEnum.SUCCESS;
  }
}
```

**Key Points**:
- ✅ Uses `IApiResponse<T>` for type-safe API responses
- ✅ Uses `ILoginRequest` and `ILoginResponse` interfaces
- ✅ Uses `ServerResponseEnum` for response code checking
- ✅ Type-safe error handling

### 2. Validation Component (`src/app/components/validation-demo/validation-demo.component.ts`)

Demonstrates using shared library utilities for validation and formatting:

```typescript
import {
  ValidationUtil,
  CommonUtil,
  CryptoUtil,
} from 'shared-lib';

export class ValidationDemoComponent {
  validateEmail(): void {
    const isValid = ValidationUtil.isValidEmail(this.email());
    this.emailValid.set(isValid);
  }

  formatDate(): void {
    const date = new Date(this.selectedDate());
    this.formattedDate.set(CommonUtil.formatDate(date));
    this.apiDate.set(CommonUtil.formatDateForAPI(date));
    this.age.set(CommonUtil.calculateAge(date));
  }

  generateUUID(): void {
    this.uuid.set(CryptoUtil.generateUUID());
  }
}
```

**Available Utilities**:

**ValidationUtil**:
- `isValidEmail(email)` - Email validation
- `isValidPhone(phone)` - Indian phone validation
- `isValidPassword(password)` - Password strength
- `isValidPAN(pan)` - PAN card validation
- `isValidGST(gst)` - GST number validation
- `isValidAadhar(aadhar)` - Aadhar validation
- `isEmpty(value)` - Empty check
- `isNumeric(value)` - Numeric check

**CommonUtil**:
- `formatDate(date)` - DD/MM/YYYY format
- `formatDateForAPI(date)` - YYYY-MM-DD format
- `formatCurrency(amount)` - Indian Rupee format
- `calculateAge(dob)` - Age calculation
- `generateRandomString(length)` - Random string
- `deepClone(obj)` - Deep clone
- `formatBytes(bytes)` - File size format
- `capitalizeFirst(str)` - Capitalize string
- `slugify(str)` - URL-friendly string

**CryptoUtil**:
- `encode(str)` - Base64 encode
- `decode(str)` - Base64 decode
- `simpleHash(str)` - Simple hash
- `generateUUID()` - UUID v4

### 3. Login Component (`src/app/components/login/login.component.ts`)

Demonstrates API integration with shared library:

```typescript
import {
  ILoginRequest,
  ServerResponseEnum,
  ValidationUtil,
} from 'shared-lib';

export class LoginComponent {
  loginData: ILoginRequest = {
    emailId: '',
    password: '',
  };

  onSubmit(): void {
    // Validate using shared library
    if (!ValidationUtil.isValidEmail(this.loginData.emailId)) {
      this.snackBar.open('Invalid email format', 'Close');
      return;
    }

    // API call with shared library types
    this.apiService.login(this.loginData).subscribe({
      next: (response) => {
        if (this.apiService.isSuccessResponse(response)) {
          // Success handling
        } else {
          const errorMsg = this.apiService.handleError(response);
          // Error handling
        }
      },
    });
  }
}
```

### 4. App Component (`src/app/app.ts`)

Demonstrates using shared library enums and utilities in the root component:

```typescript
import {
  ServerResponseEnum,
  AlertTypeEnum,
  UserStatusEnum,
  CommonUtil,
} from 'shared-lib';

export class App {
  // Expose enums for template access
  readonly ServerResponseEnum = ServerResponseEnum;
  readonly UserStatusEnum = UserStatusEnum;

  // Use shared utilities
  readonly currentDate = signal(CommonUtil.formatDate(new Date()));
  readonly serverStatus = signal(ServerResponseEnum.SUCCESS);
  readonly alertType = signal(AlertTypeEnum.SUCCESS);
  readonly userStatus = signal(UserStatusEnum.ACTIVE);
}
```

**Template Usage**:

```html
<mat-chip>
  Server Status: {{ serverStatus() === ServerResponseEnum.SUCCESS ? 'SUCCESS' : 'ERROR' }}
</mat-chip>
<mat-chip>
  User Status: {{ userStatus() === UserStatusEnum.ACTIVE ? 'ACTIVE' : 'INACTIVE' }}
</mat-chip>
```

## 📚 Available Imports

### Enums

```typescript
import {
  ServerResponseEnum,    // API response codes
  AlertTypeEnum,         // Alert types
  UserStatusEnum,        // User statuses
  AdminRoleEnum,         // Admin roles
  DietPlanStatusEnum,    // Diet plan statuses
  DietTypeEnum,          // Diet types
  MealTypeEnum,          // Meal types
  MediaFolderEnum,       // Media folders
  FileTypeEnum,          // File types
} from 'shared-lib';
```

### Interfaces

```typescript
import {
  IApiResponse<T>,       // Standard API response
  IPaginatedResponse<T>,  // Paginated response
  IUser,                 // Base user
  IAdminUser,            // Admin user
  IMember,               // Member/customer
  ILoginRequest,         // Login request
  ILoginResponse,        // Login response
  IDropdownItem,         // Dropdown item
  IBreadcrumbItem,       // Breadcrumb item
  INavItem,              // Navigation item
  IFileModel,            // File model
  ITableColumn,          // Table column
  IPaginationConfig,     // Pagination config
} from 'shared-lib';
```

### Utilities

```typescript
import {
  ValidationUtil,  // Validation functions
  CommonUtil,      // Common utilities
  CryptoUtil,      // Crypto utilities
} from 'shared-lib';
```

## 🔄 Development Workflow

### When Shared Library Changes

1. **Update shared library**:
   ```bash
   cd ../shared-lib
   # Make changes to src/
   npm run build
   ```

2. **Changes are automatically available** in eatfit247-web (no need to reinstall)

3. **Restart dev server** if needed:
   ```bash
   cd ../eatfit247-web
   npm start
   ```

### Best Practices

1. **Always use shared library types** for API responses:
   ```typescript
   // ✅ Good
   this.http.get<IApiResponse<IUser>>('/api/users/1')
   
   // ❌ Bad
   this.http.get<any>('/api/users/1')
   ```

2. **Use enums instead of magic numbers**:
   ```typescript
   // ✅ Good
   if (response.code === ServerResponseEnum.SUCCESS) { }
   
   // ❌ Bad
   if (response.code === 200) { }
   ```

3. **Use validation utilities**:
   ```typescript
   // ✅ Good
   if (ValidationUtil.isValidEmail(email)) { }
   
   // ❌ Bad
   if (email.includes('@')) { }
   ```

4. **Use formatting utilities**:
   ```typescript
   // ✅ Good
   const formatted = CommonUtil.formatDate(new Date());
   
   // ❌ Bad
   const formatted = new Date().toLocaleDateString();
   ```

## 🎨 Material M3 Integration

The shared library works seamlessly with Angular Material M3:

```typescript
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ServerResponseEnum, IApiResponse } from 'shared-lib';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [MatButtonModule, MatCardModule],
  template: `
    <mat-card>
      <mat-card-content>
        <button mat-raised-button color="primary">
          Status: {{ ServerResponseEnum.SUCCESS }}
        </button>
      </mat-card-content>
    </mat-card>
  `,
})
export class ExampleComponent {
  readonly ServerResponseEnum = ServerResponseEnum;
}
```

## 🐛 Troubleshooting

### "Cannot find module 'shared-lib'"

**Solution**:
```bash
cd ../shared-lib
npm run build
cd ../eatfit247-web
npm install
```

### Type errors with shared library

**Solution**: Ensure shared library is built:
```bash
cd ../shared-lib
npm run build
```

### Changes not reflecting

**Solution**: Rebuild shared library and restart dev server:
```bash
cd ../shared-lib && npm run build && cd ../eatfit247-web && npm start
```

## 📖 Additional Resources

- **Shared Library Documentation**: [../shared-lib/README.md](../shared-lib/README.md)
- **Architecture Overview**: [../ARCHITECTURE.md](../ARCHITECTURE.md)
- **Project Map**: [../PROJECT_MAP.md](../PROJECT_MAP.md)

## ✅ Summary

The `shared-lib` is fully integrated into eatfit247-web:

- ✅ **API Service** uses shared interfaces and enums
- ✅ **Validation Component** demonstrates utility usage
- ✅ **Login Component** shows API integration
- ✅ **App Component** uses enums and utilities
- ✅ **Type-safe** throughout the application
- ✅ **Consistent** with other EatFit247 projects

All examples are working and ready for production use! 🚀

