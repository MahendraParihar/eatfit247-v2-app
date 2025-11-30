# EatFit247 Web - Angular Material M3

Modern web application built with Angular 20+ and Material Design 3 (M3) using standalone components architecture.

## 🎨 Features

- ✅ **Angular 20+** with standalone components
- ✅ **Angular Material M3** with custom theming
- ✅ **Material Design 3** color system
- ✅ **Shared Library** integration (`shared-lib`)
- ✅ **TypeScript 5.9+** for type safety
- ✅ **SCSS** for styling
- ✅ **Proxy configuration** for API calls
- ✅ **Production-ready** build configuration

## 🏗️ Architecture

### Standalone Components
This project uses Angular's modern standalone components architecture (no NgModules):

```typescript
// app.ts - Root component
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  title = 'eatfit247-web';
}
```

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

### Material M3 Components Available

- **Buttons**: `mat-button`, `mat-raised-button`, `mat-fab`
- **Cards**: `mat-card`
- **Forms**: `mat-form-field`, `mat-input`, `mat-select`, `mat-checkbox`, `mat-radio`
- **Navigation**: `mat-toolbar`, `mat-sidenav`, `mat-menu`
- **Layout**: `mat-grid-list`, `mat-tab-group`, `mat-expansion-panel`
- **Data**: `mat-table`, `mat-paginator`, `mat-sort`
- **Dialogs**: `MatDialog`, `mat-snackbar`
- **Progress**: `mat-progress-bar`, `mat-progress-spinner`
- **Icons**: `mat-icon` with Material Icons

### Theme Customization

To customize the theme, edit `src/theme.scss`:

```scss
// Define your own color palettes
$my-primary-palette: (
  // ... color values
);

$my-theme: mat.define-theme((
  color: (
    theme-type: light,
    primary: $my-primary-palette,
    // ...
  )
));

html {
  @include mat.all-component-themes($my-theme);
}
```

### Dark Mode

Dark mode is supported via the `.dark-theme` class:

```typescript
// Toggle dark mode
document.body.classList.toggle('dark-theme');
```

## 📚 Using Shared Library

### Import from shared-lib

```typescript
import { 
  ServerResponseEnum,
  IApiResponse,
  IUser,
  ValidationUtil,
  CommonUtil 
} from 'shared-lib';

// Validate email
if (ValidationUtil.isValidEmail('user@example.com')) {
  // Valid email
}

// Format dates
const formatted = CommonUtil.formatDate(new Date());
```

### Available from Shared Library

See [shared-lib/README.md](../shared-lib/README.md) for complete documentation.

**Enums**:
- ServerResponseEnum, AlertTypeEnum
- UserStatusEnum, AdminRoleEnum
- DietPlanStatusEnum, DietTypeEnum
- MediaFolderEnum, FileTypeEnum

**Interfaces**:
- IApiResponse, IPaginatedResponse
- IUser, IAdminUser, IMember
- IDropdownItem, IBreadcrumbItem, INavItem
- IFileModel, ITableColumn

**Utils**:
- ValidationUtil - Email, phone, PAN, GST validation
- CommonUtil - Date, currency, formatting utilities
- CryptoUtil - Base64, UUID, hashing

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

### Making API Calls

```typescript
import { HttpClient } from '@angular/common/http';
import { IApiResponse, IUser } from 'shared-lib';

constructor(private http: HttpClient) {}

// API call
this.http.get<IApiResponse<IUser>>('/api/v1/users/1')
  .subscribe(response => {
    if (response.code === ServerResponseEnum.SUCCESS) {
      const user = response.data;
    }
  });
```

## 🎯 Routing

Routes are defined in `src/app/app.routes.ts`:

```typescript
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { 
    path: 'home', 
    loadComponent: () => import('./pages/home/home.component')
      .then(m => m.HomeComponent)
  },
  // Lazy-loaded routes...
];
```

## 🔒 Environment Configuration

### Development (`environment.ts`)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8001/api/v1',
  appName: 'EatFit247 Web'
};
```

### Production (`environment.prod.ts`)
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.eatfit247.com/api/v1',
  appName: 'EatFit247 Web'
};
```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Generate coverage report
npm run test -- --code-coverage
```

## 📦 Building

### Development Build
```bash
npm run build
```

### Production Build
```bash
npm run build:prod
```

Optimizations applied:
- Ahead-of-Time (AOT) compilation
- Tree-shaking
- Minification
- Source maps (disabled in prod)

## 🚀 Deployment

### Build for deployment
```bash
npm run build:prod
```

### Serve built files
The `dist/eatfit247-web/browser/` directory contains the static files.

### Docker Deployment

See [../infra/Dockerfile.client](../infra/Dockerfile.client) for containerized deployment.

## 🎨 Material M3 Design Tokens

This project uses Material Design 3 color system:

```scss
// In your components
.my-element {
  background-color: var(--mat-sys-primary);
  color: var(--mat-sys-on-primary);
  border-radius: var(--md-sys-shape-corner-medium);
  box-shadow: var(--md-sys-elevation-level2);
}
```

Available design tokens:
- **Colors**: `--mat-sys-primary`, `--mat-sys-secondary`, `--mat-sys-tertiary`
- **Surface**: `--mat-sys-surface`, `--mat-sys-surface-variant`
- **Elevation**: `--md-sys-elevation-level0` through `level3`
- **Shape**: `--md-sys-shape-corner-small`, `medium`, `large`, etc.

## 📚 Resources

- [Angular Documentation](https://angular.io/docs)
- [Angular Material M3](https://material.angular.io)
- [Material Design 3](https://m3.material.io/)
- [Shared Library](../shared-lib/README.md)

## 🤝 Working with Other Projects

### eatfit247-cms (CMS Admin)
- Shares enums, interfaces, utils via `shared-lib`
- Backend: eatfit247-cms-api

### eatfit247-cms-api (API)
- Provides REST API endpoints
- Uses shared interfaces for consistent responses
- Access via proxy or direct at `http://localhost:8001`

## 🔧 Development Tips

### Add Material Component
```bash
# Components are standalone, just import what you need
import { MatButtonModule } from '@angular/material/button';
```

### Create New Component
```bash
ng generate component components/my-component --standalone
```

### Add Route
Edit `src/app/app.routes.ts` and add lazy-loaded route:
```typescript
{
  path: 'feature',
  loadComponent: () => import('./pages/feature/feature.component')
    .then(m => m.FeatureComponent)
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

## 🐛 Troubleshooting

### Shared library not found
```bash
cd ../shared-lib
npm run build
cd ../eatfit247-web
npm install
```

### Material components not working
Ensure animations are enabled in `app.config.ts`:
```typescript
provideAnimationsAsync()
```

### API calls failing
Check `proxy.conf.json` configuration and ensure API is running at port 8001.

---

**Version**: 1.0.0  
**Angular**: 20.3.0  
**Material**: 20.2.12 (M3)  
**TypeScript**: 5.9.2
