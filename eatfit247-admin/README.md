# EatFit247 Admin

Angular-based admin application for EatFit247 platform.

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

## Quick Start

```bash
npm install
ng serve
```

## Key Features

- Material 3 Design System
- Token-driven theming (light/dark)
- Shared reusable components
- API-driven data tables
- Authentication & authorization

## Project Structure

```
src/
├── app/                    # Application code
│   ├── services/          # Services (theme, auth, etc.)
│   └── ...
├── styles/                # Design system styles
│   ├── _design-tokens.scss
│   └── _theme.scss
└── ...
libs/
├── shared/                # Shared components
│   └── data-table/        # Data table component
├── core/                  # Core services
└── admin/                 # Admin feature modules
```

## Design System Reference

See `DESIGN_SYSTEM.md` for complete design system documentation.
