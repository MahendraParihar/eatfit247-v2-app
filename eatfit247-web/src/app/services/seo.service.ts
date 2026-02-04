import { inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ISeoPageData } from 'eatfit247-shared-library';
import { SeoPageService } from './seo-page.service';

export interface SEOData {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SEOService {
  private readonly defaultTitle = 'EatFit24By7 - Your Health & Wellness Partner';
  private readonly defaultDescription =
    'EatFit24By7 offers personalized nutrition plans, health programs, and expert guidance from celebrity nutritionist Shweta Shah. Transform your health journey with our Ayurvedic and natural wellness solutions.';
  private readonly defaultKeywords =
    'nutrition, diet plan, weight loss, health, wellness, Shweta Shah, EatFit24By7, Ayurveda, dosha, immunity, celebrity nutritionist';
  private readonly siteUrl = 'https://eatfit24by7.com';
  private readonly defaultImage = `${this.siteUrl}/assets/images/logo.png`;
  private readonly seoPageService = inject(SeoPageService);

  constructor(private meta: Meta, private title: Title, private router: Router) {
    this.initializeRouterListener();
  }

  /**
   * Initialize router listener to update SEO on route changes
   */
  private initializeRouterListener(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        // Load SEO data from API on route change
        this.loadSeoForCurrentRoute();
      });
  }

  /**
   * Load SEO data for the current route from API
   */
  private async loadSeoForCurrentRoute(): Promise<void> {
    const currentUrl = this.router.url.split('?')[0]; // Remove query params
    const seoData = await this.seoPageService.getSeoByUrl(currentUrl);
    
    if (seoData && seoData.active) {
      this.updateSEOFromApiData(seoData);
    } else {
      // Fallback to default SEO if no data found
      this.updateCanonicalUrl();
    }
  }

  /**
   * Update SEO meta tags from API data (ISeoPageData)
   */
  updateSEOFromApiData(seoData: ISeoPageData): void {
    const title = seoData.metaTitle
      ? `${seoData.metaTitle} | EatFit24By7`
      : this.defaultTitle;
    const description = seoData.metaDescription || this.defaultDescription;
    const canonicalUrl = seoData.canonicalUrl
      ? seoData.canonicalUrl
      : `${this.siteUrl}${seoData.url}`;
    const ogType = seoData.ogType || 'website';
    const ogTitle = seoData.ogTitle || title;
    const ogDescription = seoData.ogDescription || description;
    const ogUrl = seoData.ogUrl || canonicalUrl;
    const twitterCard = seoData.twitterCard || 'summary_large_image';

    // Update title
    this.title.setTitle(title);

    // Update or create meta tags
    this.updateMetaTag('description', description);

    // Open Graph tags
    this.updateMetaTag('og:title', ogTitle);
    this.updateMetaTag('og:description', ogDescription);
    this.updateMetaTag('og:image', this.defaultImage);
    this.updateMetaTag('og:url', ogUrl);
    this.updateMetaTag('og:type', ogType);
    this.updateMetaTag('og:site_name', 'EatFit24By7');

    // Twitter Card tags
    this.updateMetaTag('twitter:card', twitterCard);
    this.updateMetaTag('twitter:title', ogTitle);
    this.updateMetaTag('twitter:description', ogDescription);
    this.updateMetaTag('twitter:image', this.defaultImage);

    // Update canonical URL
    this.updateCanonicalUrl(canonicalUrl);
  }

  /**
   * Update SEO meta tags
   */
  updateSEO(data: SEOData): void {
    const title = data.title
      ? `${data.title} | EatFit24By7`
      : this.defaultTitle;
    const description = data.description || this.defaultDescription;
    const keywords = data.keywords || this.defaultKeywords;
    const image = data.image || this.defaultImage;
    const url = data.url
      ? `${this.siteUrl}${data.url}`
      : `${this.siteUrl}${this.router.url}`;
    const type = data.type || 'website';

    // Update title
    this.title.setTitle(title);

    // Update or create meta tags
    this.updateMetaTag('description', description);
    this.updateMetaTag('keywords', keywords);

    // Open Graph tags
    this.updateMetaTag('og:title', title);
    this.updateMetaTag('og:description', description);
    this.updateMetaTag('og:image', image);
    this.updateMetaTag('og:url', url);
    this.updateMetaTag('og:type', type);
    this.updateMetaTag('og:site_name', 'EatFit24By7');

    // Twitter Card tags
    this.updateMetaTag('twitter:card', 'summary_large_image');
    this.updateMetaTag('twitter:title', title);
    this.updateMetaTag('twitter:description', description);
    this.updateMetaTag('twitter:image', image);

    // Update canonical URL
    this.updateCanonicalUrl(url);
  }

  /**
   * Update or create a meta tag
   */
  private updateMetaTag(property: string, content: string): void {
    if (this.meta.getTag(`property="${property}"`)) {
      this.meta.updateTag({ property, content });
    } else if (this.meta.getTag(`name="${property}"`)) {
      this.meta.updateTag({ name: property, content });
    } else {
      if (property.startsWith('og:') || property.startsWith('twitter:')) {
        this.meta.addTag({ property, content });
      } else {
        this.meta.addTag({ name: property, content });
      }
    }
  }

  /**
   * Update canonical URL
   */
  private updateCanonicalUrl(url?: string): void {
    const canonicalUrl = url || `${this.siteUrl}${this.router.url}`;
    let link: HTMLLinkElement | null =
      document.querySelector("link[rel='canonical']");

    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }

    link.setAttribute('href', canonicalUrl);
  }

  /**
   * Add structured data (JSON-LD)
   * @param data The structured data object
   * @param id Optional unique identifier for the structured data script. If not provided, a unique ID will be generated.
   */
  addStructuredData(data: object, id?: string): void {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    
    // Use provided ID or generate a unique one based on schema type
    if (id) {
      script.id = id;
    } else {
      // Generate ID based on schema type
      const schemaType = (data as any)['@type'] || 'structured-data';
      const timestamp = Date.now();
      script.id = `structured-data-${schemaType.toLowerCase()}-${timestamp}`;
    }
    
    document.head.appendChild(script);
  }

  /**
   * Remove structured data by ID or by schema type
   * @param id The ID of the structured data script to remove
   * @param schemaType Optional schema type to remove (e.g., 'Product', 'FAQPage', 'BreadcrumbList')
   */
  removeStructuredData(id?: string, schemaType?: string): void {
    if (id) {
      const script = document.getElementById(id);
      if (script) {
        script.remove();
      }
    } else if (schemaType) {
      // Remove structured data scripts matching the schema type
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      scripts.forEach((script) => {
        try {
          const data = JSON.parse(script.textContent || '{}');
          if (data['@type'] === schemaType) {
            script.remove();
          }
        } catch (e) {
          // Ignore parsing errors
        }
      });
    } else {
      // Remove page-specific structured data (Product, FAQPage, BreadcrumbList, BlogPosting)
      // but preserve global schemas (Organization, WebSite)
      const pageSpecificTypes = ['Product', 'FAQPage', 'BreadcrumbList', 'BlogPosting'];
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      scripts.forEach((script) => {
        try {
          const data = JSON.parse(script.textContent || '{}');
          if (pageSpecificTypes.includes(data['@type'])) {
            script.remove();
          }
        } catch (e) {
          // Ignore parsing errors
        }
      });
    }
  }

  /**
   * Add organization structured data
   */
  addOrganizationStructuredData(): void {
    const organizationData = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'EatFit24By7',
      url: this.siteUrl,
      logo: `${this.siteUrl}/assets/images/logo.png`,
      description: this.defaultDescription,
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+91-859-185-4209',
        contactType: 'Customer Service',
        email: 'eatfit24by7@gmail.com',
        areaServed: ['IN', 'UAE', 'USA'],
        availableLanguage: ['en', 'hi'],
      },
      sameAs: [
        'https://www.facebook.com/eatfit24by7',
        'https://www.instagram.com/eatfit24by7',
        'https://twitter.com/eatfit24by7',
        'https://www.youtube.com/eatfit24by7',
        'https://www.pinterest.com/eatfit24by7',
        'https://www.linkedin.com/company/eatfit24by7',
      ],
    };

    this.addStructuredData(organizationData);
  }

  /**
   * Add website structured data
   */
  addWebsiteStructuredData(): void {
    const websiteData = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'EatFit24By7',
      url: this.siteUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${this.siteUrl}/search?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    };

    this.addStructuredData(websiteData);
  }

  /**
   * Add product structured data
   */
  addProductStructuredData(productData: {
    name: string;
    description?: string;
    image?: string | string[];
    price?: number;
    priceCurrency?: string;
    availability?: string;
    sku?: string;
    url?: string;
  }): void {
    if (!productData.name) return;

    const productSchema: any = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: productData.name,
      description: productData.description || this.defaultDescription,
      brand: {
        '@type': 'Brand',
        name: 'EatFit24By7',
      },
    };

    // Add image(s)
    if (productData.image) {
      if (Array.isArray(productData.image)) {
        productSchema.image = productData.image;
      } else {
        productSchema.image = productData.image;
      }
    } else {
      productSchema.image = this.defaultImage;
    }

    // Add offer/price information
    if (productData.price !== undefined) {
      productSchema.offers = {
        '@type': 'Offer',
        priceCurrency: productData.priceCurrency || 'INR',
        price: productData.price.toString(),
        availability: productData.availability || 'https://schema.org/InStock',
        url: productData.url || `${this.siteUrl}/product`,
      };
    }

    // Add SKU if available
    if (productData.sku) {
      productSchema.sku = productData.sku;
    }

    // Add URL if available
    if (productData.url) {
      productSchema.url = productData.url;
    }

    this.addStructuredData(productSchema);
  }

  /**
   * Add FAQ page structured data
   */
  addFaqStructuredData(faqs: Array<{ question: string; answer: string }>): void {
    if (!faqs || faqs.length === 0) return;

    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    };

    this.addStructuredData(faqSchema);
  }

  /**
   * Add breadcrumb structured data
   */
  addBreadcrumbStructuredData(items: Array<{ name: string; url: string }>): void {
    if (!items || items.length === 0) return;

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url.startsWith('http') ? item.url : `${this.siteUrl}${item.url}`,
      })),
    };

    this.addStructuredData(breadcrumbSchema);
  }
}

