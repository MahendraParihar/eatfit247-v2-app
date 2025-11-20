# Public Assets

This folder contains public assets that are copied directly to the output directory during build.

## Folder Structure

- **images/** - Image files (jpg, png, svg, gif, webp, etc.)
- **icons/** - Icon files (svg, png, ico, etc.)
- **fonts/** - Font files (woff, woff2, ttf, otf, etc.)
- **videos/** - Video files (mp4, webm, etc.)
- **documents/** - Document files (pdf, doc, etc.)

## Usage

Files in this folder are accessible directly from the root URL. For example:
- `public/images/logo.png` → `/images/logo.png`
- `public/icons/favicon.ico` → `/icons/favicon.ico`

## Note

This folder is configured in `angular.json` under the `assets` section.

