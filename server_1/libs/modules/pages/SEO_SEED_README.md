# SEO Data Seeding Guide

This module provides functionality to seed SEO metadata for website pages from a CSV file.

## Database Model

The SEO data is stored in the `mst_seo_pages` table with the following fields:
- `url` - The page URL path (e.g., `/our-programs`, `/products/weight-loss-pro`)
- `meta_title` - Page title for SEO
- `meta_description` - Meta description
- `canonical_url` - Canonical URL
- `og_type` - Open Graph type (website, product, etc.)
- `og_title` - Open Graph title
- `og_description` - Open Graph description
- `og_url` - Open Graph URL
- `twitter_card` - Twitter card type

## CSV Format

The CSV file should have the following columns:
- `url` - Full URL (e.g., `https://eatfit24by7.com/our-programs/`)
- `suggested_title` - Suggested page title
- `suggested_meta_description` - Suggested meta description
- `suggested_canonical` - Suggested canonical URL
- `suggested_og_type` - Suggested OG type
- `suggested_og_title` - Suggested OG title
- `suggested_og_description` - Suggested OG description
- `suggested_og_url` - Suggested OG URL
- `suggested_twitter_card` - Suggested Twitter card type

## Seeding Methods

### Method 1: Using the Admin API Endpoint

1. Start the admin API server
2. Authenticate and get a JWT token
3. Make a POST request to `/seo-page/seed`:

```bash
curl -X POST http://localhost:8000/seo-page/seed \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "csvFilePath": "/path/to/eatfit24by7_seo_each_link_seed.csv"
  }'
```

### Method 2: Using the Standalone Script

1. Navigate to the project root
2. Run the seed script:

```bash
npx ts-node server_1/libs/modules/pages/src/scripts/run-seed.ts /path/to/eatfit24by7_seo_each_link_seed.csv
```

**Note:** Make sure the database is running and accessible before running the seed script.

## API Endpoints

### Public Endpoints

- `GET /seo-page/url/:url` - Get SEO data by URL path
  - Example: `GET /seo-page/url/%2Four-programs`
  - Returns SEO data for the specified URL

- `GET /seo-page/all` - Get all active SEO data
  - Returns all active SEO pages

### Admin Endpoints (Requires Authentication)

- `GET /seo-page/list` - List all SEO pages
- `GET /seo-page/manage/:id` - Get SEO page by ID
- `POST /seo-page/manage` - Create a new SEO page
- `PUT /seo-page/manage/:id` - Update an existing SEO page
- `PATCH /seo-page/update-status/:id` - Update active status
- `POST /seo-page/seed` - Seed SEO data from CSV file

## Usage in Frontend

The frontend can fetch SEO data for a page using the public API:

```typescript
// Example: Fetch SEO data for current route
const url = router.url; // e.g., '/our-programs'
const response = await http.get(`/api/seo-page/url/${encodeURIComponent(url)}`);
const seoData = response.data;

// Use the SEO data to update meta tags
if (seoData) {
  seoService.updateSEO({
    title: seoData.metaTitle,
    description: seoData.metaDescription,
    url: seoData.url,
    type: seoData.ogType,
  });
}
```

## Notes

- The seed script automatically extracts the pathname from full URLs
- Trailing slashes are removed from URLs (except for root `/`)
- If a URL already exists, the data will be updated (upsert behavior)
- All seeded pages are set to `active: true` by default

