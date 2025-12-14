# EatFit247 Admin – Design System (Material 3)

> **Single source of truth** for EatFit247 Admin UI.
> This file must be used by **Cursor AI, developers, and reviewers**.

---

## 1. Design Principles

- Material 3 (M3) compliant
- Token-driven theming (NO hardcoded colors)
- Light & Dark theme parity
- Admin-first UX (dense, readable, fast)
- Accessibility-first (WCAG 2.1 AA)


---

## 2. Tech Stack

- Angular 16+
- Angular Material (M3)
- Nx Monorepo
- SCSS
- ECharts

---

## 3. Brand Identity

| Property | Value |
|--------|------|
| Primary Color | #fc2305 |
| Font | Inter / Roboto |
| Card Radius | 16px |
| Button Radius | 12px |
| Chip Radius | 999px |


---

## 4. Theme Architecture (Nx)

```
libs/
 └── shared/
     └── theme/
         ├── src/lib/
         │   ├── _tokens.scss
         │   ├── _status.tokens.scss
         │   ├── _light.theme.scss
         │   ├── _dark.theme.scss
         │   ├── _table.scss
         │   └── index.scss
```

Themes are applied ONLY via class:
- light-theme
- dark-theme


---

## 5. Material 3 Core Color Tokens

### Light Theme
```scss
.light-theme {
  --md-sys-color-primary: #fc2305;
  --md-sys-color-on-primary: #ffffff;
  --md-sys-color-surface: #ffffff;
  --md-sys-color-surface-container: #f7f7f7;
  --md-sys-color-surface-container-low: #fafafa;
  --md-sys-color-surface-container-high: #ededed;
  --md-sys-color-outline: #e0e0e0;
  --md-sys-color-outline-variant: #d6d6d6;
  --md-sys-color-on-surface: #1c1b1f;
}
```

### Dark Theme
```scss
.dark-theme {
  --md-sys-color-primary: #ff5c47;
  --md-sys-color-on-primary: #1a1a1a;
  --md-sys-color-surface: #121212;
  --md-sys-color-surface-container: #1e1e1e;
  --md-sys-color-surface-container-low: #181818;
  --md-sys-color-surface-container-high: #2a2a2a;
  --md-sys-color-outline: #3a3a3a;
  --md-sys-color-outline-variant: #444444;
  --md-sys-color-on-surface: #e6e6e6;
}
```


---

## 6. Semantic Status Colors (MANDATORY)

### Tokens
```scss
.light-theme {
  --status-success: #1b8f5a;
  --status-success-bg: #e6f4ec;
  --status-warning: #f29900;
  --status-warning-bg: #fff4e0;
  --status-error: #d32f2f;
  --status-error-bg: #fdecea;
  --status-info: #1976d2;
  --status-info-bg: #e3f2fd;
}

.dark-theme {
  --status-success: #5dd8a0;
  --status-success-bg: #0f2a1f;
  --status-warning: #ffb74d;
  --status-warning-bg: #2a1f0f;
  --status-error: #ef9a9a;
  --status-error-bg: #2a1212;
  --status-info: #90caf9;
  --status-info-bg: #0f1e2a;
}
```

Usage:
```html
<span class="status-chip success">Active</span>
```


---

## 7. Shared Admin Table (NON-NEGOTIABLE)

Rules:
- Must use shared table component
- Pagination always enabled
- Hover state required
- Actions right-aligned
- No custom tables allowed


Violation = PR rejection.

---

## 8. Buttons

Types:
- Primary (brand)
- Secondary (outlined)
- Danger (error token)

Rules:
- Only ONE primary per screen
- Destructive actions use error token


---

## 9. Forms

Rules:
- Angular Material controls ONLY
- Error text uses status-error token
- Must be readable in dark mode


---

## 10. Charts (ECharts – Theme Aware)

Rules:
- ECharts only
- Read CSS variables dynamically
- Re-render on theme change
- No inline colors


---

## 11. Elevation

- Cards: subtle (level 1)
- Tables: surface container elevation
- Dialogs: Material default


---

## 12. Accessibility (WCAG 2.1 AA)

Targets:
- Normal text ≥ 4.5:1
- Large text ≥ 3:1
- Keyboard navigation
- aria-label for icons


---

## 13. Admin UI Checklist (PR GATE)

Before raising PR:

- [ ] No hardcoded colors
- [ ] M3 tokens used
- [ ] Dark mode tested
- [ ] Shared table used
- [ ] Status tokens used
- [ ] Charts theme-aware
- [ ] WCAG contrast checked


---

## 14. Do / Don’t

### Do
- Follow this design system
- Use shared components
- Test both themes

### Don’t
- Hardcode colors
- Duplicate UI
- Use inline styles


---

## 15. Source of Truth

1. This document
2. Code comments

---

## 16. Ownership

Owned by **EatFit247 Platform Team**.

All admin UI MUST:
- Follow this document
- Pass accessibility & checklist

Cursor AI must treat this file as **authoritative and non-negotiable**.
