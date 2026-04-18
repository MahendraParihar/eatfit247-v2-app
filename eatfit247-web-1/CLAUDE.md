# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run

```bash
npm install
npm start                    # dev server on :4200, proxies to public-api at :3000
npm run build                # production SSR build (esbuild)
npm test                     # Jest unit tests
```

Dev proxy config: `proxy.config.json` → `http://localhost:3000/api/v2/public`

## Architecture

Angular 21 SSR website using standalone components and zoneless change detection.

```
src/
├── app/
│   ├── core/              # Services, interfaces, utilities
│   └── ui/                # All page components (standalone)
├── styles/                # 3-tier SCSS design token system
├── main.ts                # CSR bootstrap
├── main.server.ts         # SSR bootstrap
└── server.ts              # Express SSR server
libs/
└── shared-ui/             # Reusable public-facing UI components (Banner, Card, Container, etc.)
```

## SSR Rendering

```
main.server.ts → app.config.server.ts → app.routes.server.ts
                                              ↓
server.ts (Express) → serves /browser static + SSR requests
```

- Static routes: Angular pre-rendered (SSR default)
- Dynamic routes (`:id`, `:slug`, `**`): `RenderMode.Server` (per-request SSR)

## Code Standards

- **Standalone components only**: All components use standalone with `inject()` — no NgModules.
- **Zoneless**: Uses zoneless change detection (`provideZonelessChangeDetection`).
- **No hardcoded colors**: Use CSS custom properties from the 3-tier design token system (`_primitive-tokens.scss` → `_semantic-tokens.scss` → `_component-tokens.scss`).
- **No `any` keyword**: Define typed interfaces for all data.
- **Always create `.html` and `.scss` files** alongside component `.ts` files.
- **Stylelint**: SCSS is linted via `.stylelintrc.json`.

## Design Token System

```
_primitive-tokens.scss      # Raw color/size values
_semantic-tokens.scss       # Purpose-mapped tokens (primary, surface, error)
_component-tokens.scss      # Component-scoped tokens
_accessibility.scss         # WCAG compliance utilities
_breakpoints.scss           # Responsive breakpoints
_spacing-tokens.scss        # Spacing scale
_typography-tokens.scss     # Font scale
_grid-utilities.scss        # Grid layout helpers
_button-utilities.scss      # Button variants
```
