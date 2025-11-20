# Assets

This folder contains application assets that are processed and bundled during build.

## Folder Structure

- **images/** - Image files (jpg, png, svg, gif, webp, etc.)
- **icons/** - Icon files (svg, png, ico, etc.)
- **fonts/** - Font files (woff, woff2, ttf, otf, etc.)
- **videos/** - Video files (mp4, webm, etc.)
- **documents/** - Document files (pdf, doc, etc.)

## Usage

Files in this folder are accessible via the `/assets/` path. For example:
- `src/assets/images/logo.png` → `/assets/images/logo.png`
- `src/assets/icons/icon.svg` → `/assets/icons/icon.svg`

## Note

To use assets in Angular components:
```typescript
// In component
imageUrl = '/assets/images/logo.png';

// In template
<img [src]="imageUrl" alt="Logo">
// or
<img src="/assets/images/logo.png" alt="Logo">
```

