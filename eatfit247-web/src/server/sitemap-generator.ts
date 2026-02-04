/**
 * Dynamic Sitemap Generator
 * Generates sitemap.xml dynamically from API data
 */

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

interface IResponse<T> {
  data?: T;
  success?: boolean;
  message?: string;
}

interface TableListResponse<T> {
  tableData: T[];
  count: number;
}

interface Blog {
  blogId: number;
  title: string;
  seo?: {
    url?: string;
  };
  writtenAt?: string;
  updatedAt?: string;
}

interface Product {
  productId: number;
  name: string;
  seo?: {
    url?: string;
  };
  updatedAt?: string;
}

interface Program {
  programId: number;
  program: string;
  seo?: {
    url?: string;
  };
  updatedAt?: string;
}

export class SitemapGenerator {
  private readonly baseUrl: string;
  private readonly siteUrl: string = 'https://eatfit24by7.com';
  private readonly apiUrl: string;

  constructor(apiBaseUrl: string) {
    this.apiUrl = apiBaseUrl;
  }

  /**
   * Generate sitemap XML
   */
  async generateSitemap(): Promise<string> {
    const urls = await this.getAllUrls();
    return this.buildXml(urls);
  }

  /**
   * Get all URLs for sitemap
   */
  private async getAllUrls(): Promise<SitemapUrl[]> {
    const urls: SitemapUrl[] = [];

    // Static pages
    urls.push(...this.getStaticPages());

    // Dynamic content
    try {
      const [blogs, products, programs] = await Promise.all([
        this.fetchBlogs(),
        this.fetchProducts(),
        this.fetchPrograms(),
      ]);

      urls.push(...blogs);
      urls.push(...products);
      urls.push(...programs);
    } catch (error) {
      console.error('Error fetching dynamic content for sitemap:', error);
      // Continue with static pages even if dynamic content fails
    }

    return urls;
  }

  /**
   * Get static pages
   */
  private getStaticPages(): SitemapUrl[] {
    const today = new Date().toISOString().split('T')[0];
    
    return [
      {
        loc: `${this.siteUrl}/`,
        lastmod: today,
        changefreq: 'daily',
        priority: 1.0,
      },
      {
        loc: `${this.siteUrl}/about-us`,
        lastmod: today,
        changefreq: 'monthly',
        priority: 0.9,
      },
      {
        loc: `${this.siteUrl}/about-shweta-shah`,
        lastmod: today,
        changefreq: 'monthly',
        priority: 0.9,
      },
      {
        loc: `${this.siteUrl}/our-programs`,
        lastmod: today,
        changefreq: 'weekly',
        priority: 0.9,
      },
      {
        loc: `${this.siteUrl}/product`,
        lastmod: today,
        changefreq: 'weekly',
        priority: 0.9,
      },
      {
        loc: `${this.siteUrl}/know-your-body-dosha`,
        lastmod: today,
        changefreq: 'monthly',
        priority: 0.8,
      },
      {
        loc: `${this.siteUrl}/know-your-current-immunity-score`,
        lastmod: today,
        changefreq: 'monthly',
        priority: 0.8,
      },
      {
        loc: `${this.siteUrl}/press-and-media`,
        lastmod: today,
        changefreq: 'weekly',
        priority: 0.7,
      },
      {
        loc: `${this.siteUrl}/success-stories`,
        lastmod: today,
        changefreq: 'weekly',
        priority: 0.8,
      },
      {
        loc: `${this.siteUrl}/blog`,
        lastmod: today,
        changefreq: 'daily',
        priority: 0.8,
      },
      {
        loc: `${this.siteUrl}/faq`,
        lastmod: today,
        changefreq: 'monthly',
        priority: 0.7,
      },
      {
        loc: `${this.siteUrl}/contact-us`,
        lastmod: today,
        changefreq: 'monthly',
        priority: 0.7,
      },
    ];
  }

  /**
   * Fetch blog posts from API
   */
  private async fetchBlogs(): Promise<SitemapUrl[]> {
    try {
      const response = await fetch(
        `${this.apiUrl}/public/blog/list?page=0&limit=1000`
      );
      
      if (!response.ok) {
        console.error(`Failed to fetch blogs: ${response.statusText}`);
        return [];
      }

      const result: IResponse<TableListResponse<Blog>> = await response.json();
      const blogs = result.data?.tableData || [];

      return blogs.map((blog) => {
        const slug = blog.seo?.url || blog.title.toLowerCase().replace(/\s+/g, '-');
        const lastmod = blog.updatedAt 
          ? new Date(blog.updatedAt).toISOString().split('T')[0]
          : blog.writtenAt
          ? new Date(blog.writtenAt).toISOString().split('T')[0]
          : undefined;

        return {
          loc: `${this.siteUrl}/blog/${encodeURIComponent(slug)}`,
          lastmod,
          changefreq: 'weekly' as const,
          priority: 0.7,
        };
      });
    } catch (error) {
      console.error('Error fetching blogs:', error);
      return [];
    }
  }

  /**
   * Fetch products from API
   */
  private async fetchProducts(): Promise<SitemapUrl[]> {
    try {
      const response = await fetch(
        `${this.apiUrl}/public/products/list?page=0&limit=1000`
      );
      
      if (!response.ok) {
        console.error(`Failed to fetch products: ${response.statusText}`);
        return [];
      }

      const result: IResponse<TableListResponse<Product>> = await response.json();
      const products = result.data?.tableData || [];

      return products.map((product) => {
        const slug = product.seo?.url || product.name.toLowerCase().replace(/\s+/g, '-');
        const lastmod = product.updatedAt
          ? new Date(product.updatedAt).toISOString().split('T')[0]
          : undefined;

        return {
          loc: `${this.siteUrl}/product/${encodeURIComponent(slug)}`,
          lastmod,
          changefreq: 'weekly' as const,
          priority: 0.8,
        };
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  /**
   * Fetch programs from API
   */
  private async fetchPrograms(): Promise<SitemapUrl[]> {
    try {
      const response = await fetch(
        `${this.apiUrl}/public/program/list?page=0&limit=1000`
      );
      
      if (!response.ok) {
        console.error(`Failed to fetch programs: ${response.statusText}`);
        return [];
      }

      const result: IResponse<TableListResponse<Program>> = await response.json();
      const programs = result.data?.tableData || [];

      return programs.map((program) => {
        // Programs use ID in URL based on routes
        const lastmod = program.updatedAt
          ? new Date(program.updatedAt).toISOString().split('T')[0]
          : undefined;

        return {
          loc: `${this.siteUrl}/our-programs/${program.programId}`,
          lastmod,
          changefreq: 'monthly' as const,
          priority: 0.7,
        };
      });
    } catch (error) {
      console.error('Error fetching programs:', error);
      return [];
    }
  }

  /**
   * Build XML from URLs
   */
  private buildXml(urls: SitemapUrl[]): string {
    const urlEntries = urls.map((url) => {
      let entry = `  <url>\n    <loc>${this.escapeXml(url.loc)}</loc>`;
      
      if (url.lastmod) {
        entry += `\n    <lastmod>${url.lastmod}</lastmod>`;
      }
      
      if (url.changefreq) {
        entry += `\n    <changefreq>${url.changefreq}</changefreq>`;
      }
      
      if (url.priority !== undefined) {
        entry += `\n    <priority>${url.priority.toFixed(1)}</priority>`;
      }
      
      entry += '\n  </url>';
      return entry;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urlEntries}
</urlset>`;
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

