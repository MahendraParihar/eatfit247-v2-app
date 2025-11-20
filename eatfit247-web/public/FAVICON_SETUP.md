# Favicon Setup Guide

This document explains how to set up favicons and apple-touch-icons for the EatFit24By7 website.

## Required Files

To complete the favicon setup, you need to create the following image files:

### Favicon Files (in `/public/` directory):
1. **favicon.ico** - 16x16, 32x32, 48x48 multi-size ICO file (already exists)
2. **favicon-16x16.png** - 16x16 PNG
3. **favicon-32x32.png** - 32x32 PNG
4. **favicon-96x96.png** - 96x96 PNG
5. **favicon-192x192.png** - 192x192 PNG (for Android)
6. **favicon-512x512.png** - 512x512 PNG (for Android)

### Apple Touch Icons (in `/src/assets/images/` directory):
1. **apple-touch-icon.png** - 180x180 PNG (for iOS devices)
2. **apple-touch-icon-57x57.png** - 57x57 PNG (legacy iOS)
3. **apple-touch-icon-60x60.png** - 60x60 PNG (legacy iOS)
4. **apple-touch-icon-72x72.png** - 72x72 PNG (legacy iOS)
5. **apple-touch-icon-76x76.png** - 76x76 PNG (legacy iOS)
6. **apple-touch-icon-114x114.png** - 114x114 PNG (legacy iOS)
7. **apple-touch-icon-120x120.png** - 120x120 PNG (legacy iOS)
8. **apple-touch-icon-144x144.png** - 144x144 PNG (legacy iOS)
9. **apple-touch-icon-152x152.png** - 152x152 PNG (legacy iOS)
10. **apple-touch-icon-180x180.png** - 180x180 PNG (modern iOS)

### Web App Manifest Icons:
- **android-chrome-192x192.png** - 192x192 PNG
- **android-chrome-512x512.png** - 512x512 PNG

## How to Create Favicons

### Option 1: Using Online Tools
1. Visit [Favicon Generator](https://realfavicongenerator.net/) or [Favicon.io](https://favicon.io/)
2. Upload your logo image (preferably square, at least 512x512px)
3. Download the generated favicon package
4. Place files in the appropriate directories as listed above

### Option 2: Using Design Software
1. Create a square version of your logo (512x512px recommended)
2. Export in multiple sizes:
   - 16x16, 32x32, 96x96, 192x192, 512x512 for favicons
   - 180x180 for apple-touch-icon
3. Use an ICO converter for favicon.ico (multi-size ICO file)

### Option 3: Using Command Line (ImageMagick)
```bash
# Convert logo to various sizes
convert logo.png -resize 16x16 favicon-16x16.png
convert logo.png -resize 32x32 favicon-32x32.png
convert logo.png -resize 180x180 apple-touch-icon.png
# etc.
```

## Current Setup

The `index.html` file is already configured with favicon links. Once you add the image files, they will automatically be used.

## File Locations

- **Favicon files**: `/public/` directory (copied to root during build)
- **Apple touch icons**: `/src/assets/images/` directory (accessible at `/assets/images/`)

## Testing

After adding favicon files:
1. Clear browser cache
2. Test in different browsers (Chrome, Firefox, Safari, Edge)
3. Test on mobile devices (iOS Safari, Android Chrome)
4. Use browser DevTools to verify favicon loading

## Notes

- Favicon.ico should be a multi-size ICO file containing 16x16, 32x32, and 48x48 sizes
- Apple touch icons should have rounded corners (iOS adds them automatically, but you can pre-round them)
- Use PNG format for all icons except favicon.ico
- Ensure icons are optimized for file size while maintaining quality

