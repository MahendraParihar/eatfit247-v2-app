import { Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

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
        // Update canonical URL on route change
        this.updateCanonicalUrl();
      });
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
   */
  addStructuredData(data: object): void {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    script.id = 'structured-data';
    document.head.appendChild(script);
  }

  /**
   * Remove structured data
   */
  removeStructuredData(): void {
    const script = document.getElementById('structured-data');
    if (script) {
      script.remove();
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
}

