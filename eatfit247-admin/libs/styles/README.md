# Shared Styles Library

This library provides centralized styles, design tokens, and theme configuration for the EatFit247 Admin application.

## Structure

```
libs/styles/src/lib/
├── _design-tokens.scss    # CSS custom properties (Material 3 design tokens)
├── _status-tokens.scss    # Status color utility classes
├── _theme.scss            # Material 3 theme configuration
├── _functions.scss         # SCSS utility functions (rem, stripUnit)
├── _mixins.scss           # Reusable SCSS mixins (flex-row, flex-column, etc.)
├── _variables.scss        # SCSS variables (spacing, typography, etc.)
└── styles.scss            # Main entry point (imports all above)
```

## Usage

### Import All Styles

In your component SCSS file:

```scss
@use 'styles' as *;

.my-component {
  color: var(--md-sys-color-on-surface);
  padding: $spacing-16;
}
```

**Note:** This requires `libs/styles/src/lib` to be in `stylePreprocessorOptions.includePaths` in `angular.json` (already configured).

### Import Specific Modules

```scss
// Import only design tokens (CSS custom properties)
@use '_design-tokens' as *;

// Import only status tokens (utility classes)
@use '_status-tokens' as *;

// Import only theme configuration
@use '_theme' as *;

// Import only SCSS variables
@use '_variables' as *;
```

## Design Tokens

Design tokens are CSS custom properties that support theming:

```scss
.my-component {
  background: var(--md-sys-color-surface);
  color: var(--md-sys-color-on-surface);
  border-radius: var(--radius-card);
  box-shadow: var(--elevation-level-1);
}
```

### Spacing Variables (CSS Custom Properties)

Use CSS custom properties for spacing values. All values are automatically converted to rem:

```scss
.my-component {
  padding: var(--spacing-16);    // 1rem (16px / 16px)
  margin: var(--spacing-32);     // 2rem (32px / 16px)
  gap: var(--spacing-8);         // 0.5rem (8px / 16px)
  margin-bottom: var(--spacing-24); // 1.5rem (24px / 16px)
}
```

**Available spacing variables:** `--spacing-0` through `--spacing-200` in 4px increments (e.g., `--spacing-4`, `--spacing-8`, `--spacing-12`, `--spacing-16`, `--spacing-20`, `--spacing-24`, `--spacing-32`, etc.)

All spacing values are automatically converted to rem units based on a 16px base font size.

## Status Tokens

Use status utility classes for status indicators:

```html
<span class="status-chip success">Active</span>
<span class="status-chip warning">Pending</span>
<span class="status-chip error">Failed</span>
<span class="status-chip info">Info</span>
```

## SCSS Variables

Use SCSS variables for spacing, typography, and other values. All spacing and typography values use `rem()` for better scalability:

```scss
.my-component {
  padding: $spacing-16;  // rem(16px) = 1rem
  margin: $spacing-24;   // rem(24px) = 1.5rem
  font-size: $font-size-base;  // rem(16px) = 1rem
  font-weight: $font-weight-medium;
}
```

## Functions

Utility functions for unit conversions:

```scss
@use 'styles' as *;

.my-component {
  // Convert px to rem
  padding: rem(16px);  // Returns: 1rem
  margin: rem(24px);   // Returns: 1.5rem
  
  // Custom base font size
  font-size: rem(18px, 18px);  // Returns: 1rem (based on 18px base)
}
```

## Mixins

Reusable layout mixins:

```scss
@use 'styles' as *;

.my-container {
  @include flex-row;      // display: flex; flex-direction: row;
  @include flex-column;   // display: flex; flex-direction: column;
  @include flex-center;   // display: flex; align-items: center; justify-content: center;
  @include flex-between;  // display: flex; align-items: center; justify-content: space-between;
  @include flex-start;    // display: flex; align-items: center; justify-content: flex-start;
  @include flex-end;      // display: flex; align-items: center; justify-content: flex-end;
}
```

## Theme

The theme is automatically applied via Material 3. Themes are controlled via CSS classes:
- `.light-theme` - Light theme (default)
- `.dark-theme` - Dark theme

## Reference

See `DESIGN_SYSTEM.md` in the project root for the complete design system documentation.

