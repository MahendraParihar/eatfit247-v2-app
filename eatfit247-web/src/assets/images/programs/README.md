# Program Images

This directory contains images for the "Our Programs" page.

## Required Images

Please add the following program images (JPG or PNG format, recommended size: 400x300px or 600x400px):

1. **de-bloat.jpg** - De-bloat program image
2. **weight-loss-pro.jpg** - Weight Loss PRO program image
3. **weight-loss-max.jpg** - Weight Loss MAX program image
4. **skin-hair.jpg** - Skin & Hair program image
5. **gut-health.jpg** - Gut Health program image
6. **ayurvedic-sattvic.jpg** - Ayurvedic / Sattvic diet program image
7. **beat-pcos.jpg** - Beat PCOS program image
8. **pregnancy-care.jpg** - Pregnancy Health and Care program image
9. **kiddos-nutrition.jpg** - Kiddo's Nutrition program image
10. **genz-lifestyle.jpg** - Healthy lifestyle for GenZ program image
11. **cleanse-plan.jpg** - Cleanse Plan program image
12. **try-see-plan.jpg** - Try and see plan program image
13. **muscle-gain.jpg** - Muscle Gain program image
14. **placeholder.jpg** - Fallback image if program image fails to load (optional)

## Image Requirements

- **Format**: JPG or PNG
- **Recommended Size**: 600x400px (3:2 aspect ratio) or 400x300px
- **File Size**: Optimize images to keep file size under 200KB each
- **Quality**: High quality, professional images related to each program
- **Naming**: Use exact filenames as listed above (lowercase with hyphens)

## Getting Images from Website

You can extract images from https://eatfit24by7.com/our-programs/:

1. **Right-click** on program images on the website
2. **Save image** with the exact filename listed above
3. **Optimize** images using tools like:
   - [TinyPNG](https://tinypng.com/) - Image compression
   - [Squoosh](https://squoosh.app/) - Image optimization
   - [ImageOptim](https://imageoptim.com/) - Batch optimization

## Fallback Behavior

If an image fails to load, the component will:
1. Show a placeholder image if `placeholder.jpg` exists
2. Fall back to the icon-based design if no placeholder is available

## Current Setup

The component is configured to look for images in `/assets/images/programs/` directory.
All image paths are already set up in `our-programs.component.ts`.

