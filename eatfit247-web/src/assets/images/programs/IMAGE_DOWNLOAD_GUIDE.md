# Download Program Images from Website

This guide helps you download program images from https://eatfit24by7.com/our-programs/

## Method 1: Manual Download (Recommended)

1. Visit https://eatfit24by7.com/our-programs/
2. Open browser DevTools (F12 or Right-click → Inspect)
3. Go to **Network** tab → Filter by **Img**
4. Scroll down the page to load all program images
5. Right-click on each program image → **Save image as...**
6. Rename files to match the required names (see list below)
7. Place all files in `/src/assets/images/programs/` directory

## Method 2: Using Browser Extension

1. Install a browser extension like "Image Downloader" or "Download All Images"
2. Visit https://eatfit24by7.com/our-programs/
3. Use the extension to download all images
4. Rename and organize files as needed

## Method 3: Using Command Line (wget/curl)

If you have the direct image URLs, you can use:

```bash
cd /Users/mahendraparihar/Projects/EatFit247/eatfit247-v2-app/eatfit247-web/src/assets/images/programs

# Example (replace URLs with actual image URLs from website):
curl -o de-bloat.jpg "https://eatfit24by7.com/wp-content/uploads/.../de-bloat.jpg"
curl -o weight-loss-pro.jpg "https://eatfit24by7.com/wp-content/uploads/.../weight-loss-pro.jpg"
# ... repeat for all programs
```

## Required File Names

Save images with these exact filenames:

1. `de-bloat.jpg`
2. `weight-loss-pro.jpg`
3. `weight-loss-max.jpg`
4. `skin-hair.jpg`
5. `gut-health.jpg`
6. `ayurvedic-sattvic.jpg`
7. `beat-pcos.jpg`
8. `pregnancy-care.jpg`
9. `kiddos-nutrition.jpg`
10. `genz-lifestyle.jpg`
11. `cleanse-plan.jpg`
12. `try-see-plan.jpg`
13. `muscle-gain.jpg`
14. `placeholder.jpg` (optional - fallback image)

## Image Optimization

After downloading, optimize images:

1. **Resize**: Recommended size 600x400px (3:2 ratio)
2. **Compress**: Use [TinyPNG](https://tinypng.com/) or [Squoosh](https://squoosh.app/)
3. **Target Size**: Keep each image under 200KB for fast loading

## Verification

After adding images:
1. Run `npm start` to test locally
2. Check browser console for any 404 errors
3. Verify images display correctly on the programs page
4. Test on mobile devices for responsive behavior

## Notes

- Images will automatically display once placed in the correct directory
- If an image fails to load, it will fall back to the icon-based design
- All image paths are already configured in the component

