import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse
} from '@angular/ssr/node';
import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

const SITE_URL = 'https://eatfit24by7.com';
const API_BASE = process.env['API_URL'] || 'https://eatfit24by7.com/api/v2/public';

const STATIC_URLS: { loc: string; changefreq: string; priority: string }[] = [
  { loc: '/', changefreq: 'weekly', priority: '1.0' },
  { loc: '/our-programs', changefreq: 'weekly', priority: '0.9' },
  { loc: '/product', changefreq: 'weekly', priority: '0.9' },
  { loc: '/success-stories', changefreq: 'weekly', priority: '0.8' },
  { loc: '/blog', changefreq: 'daily', priority: '0.8' },
  { loc: '/about-us', changefreq: 'monthly', priority: '0.7' },
  { loc: '/about-shweta-shah', changefreq: 'monthly', priority: '0.7' },
  { loc: '/press-and-media', changefreq: 'monthly', priority: '0.6' },
  { loc: '/faq', changefreq: 'monthly', priority: '0.6' },
  { loc: '/contact-us', changefreq: 'monthly', priority: '0.6' },
  { loc: '/know-your-body-dosha', changefreq: 'monthly', priority: '0.5' },
  { loc: '/know-your-current-immunity-score', changefreq: 'monthly', priority: '0.5' },
  { loc: '/terms-and-conditions', changefreq: 'yearly', priority: '0.3' },
  { loc: '/privacy-policy', changefreq: 'yearly', priority: '0.3' },
];

/** Known route prefixes — requests not matching these get a 404 status */
const KNOWN_ROUTES = new Set([
  '/', '/about-us', '/about-shweta-shah', '/our-programs', '/success-stories',
  '/blog', '/press-and-media', '/product', '/faq', '/contact-us',
  '/terms-and-conditions', '/privacy-policy', '/checkout', '/checkout/success',
  '/know-your-body-dosha', '/know-your-current-immunity-score',
]);

function isKnownRoute(url: string): boolean {
  const path = url.split('?')[0];
  if (KNOWN_ROUTES.has(path)) return true;
  // Check dynamic route prefixes
  return path.startsWith('/our-programs/') || path.startsWith('/blog/') || path.startsWith('/product/');
}

function buildSitemapXml(urls: { loc: string; lastmod?: string; changefreq: string; priority: string }[]): string {
  const today = new Date().toISOString().split('T')[0];
  const entries = urls
    .map(
      (u) =>
        `  <url>\n    <loc>${SITE_URL}${u.loc}</loc>\n    <lastmod>${u.lastmod || today}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`;
}

async function fetchJson(url: string): Promise<unknown> {
  const { default: fetch } = await import('node-fetch');
  const res = await (fetch as (u: string) => Promise<{ json: () => Promise<unknown> }>)(url);
  return res.json();
}

app.get('/sitemap.xml', async (_req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const urls = [...STATIC_URLS.map((u) => ({ ...u, lastmod: today }))];

    try {
      const blogData = await fetchJson(`${API_BASE}/blog/list?page=0&pageSize=200`) as {
        data?: { tableData?: { seo?: { url?: string }; writtenAt?: string }[] };
      };
      const blogs = blogData?.data?.tableData ?? [];
      for (const blog of blogs) {
        const slug = blog?.seo?.url;
        if (slug) {
          urls.push({
            loc: `/blog/${slug}`,
            lastmod: blog.writtenAt ? new Date(blog.writtenAt).toISOString().split('T')[0] : today,
            changefreq: 'monthly',
            priority: '0.7',
          });
        }
      }
    } catch {
      // Blog fetch failed — static URLs still included
    }

    try {
      const productData = await fetchJson(`${API_BASE}/products/list?page=0&pageSize=50`) as {
        data?: { tableData?: { seo?: { url?: string }; updatedAt?: string }[] };
      };
      const products = productData?.data?.tableData ?? [];
      for (const product of products) {
        const slug = product?.seo?.url;
        if (slug) {
          urls.push({
            loc: `/product/${slug}`,
            lastmod: product.updatedAt ? new Date(product.updatedAt).toISOString().split('T')[0] : today,
            changefreq: 'weekly',
            priority: '0.8',
          });
        }
      }
    } catch {
      // Product fetch failed — static URLs still included
    }

    res.set('Content-Type', 'application/xml');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(buildSitemapXml(urls));
  } catch (err) {
    res.status(500).send('Error generating sitemap');
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: 'index.html',
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use('/**', (req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => {
      if (response) {
        // Set 404 status for not-found pages
        if (req.originalUrl && !isKnownRoute(req.originalUrl)) {
          res.status(404);
        }
        writeResponseToNodeResponse(response, res);
      } else {
        next();
      }
    })
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = Number(process.env['PORT']) || 4000;
  const host = process.env['HOST'] || '0.0.0.0';
  app.listen(port, host, () => {
    console.log(`Node Express server listening on http://${host}:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
