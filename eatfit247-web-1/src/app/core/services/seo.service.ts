import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ISeoPageData } from '@eatfit247-shared-library/core';
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
  private readonly defaultTitle = 'EatFit247 - Your Health & Wellness Partner';
  private readonly defaultDescription =
    'EatFit247 offers personalized nutrition plans, health programs, and expert guidance from celebrity nutritionist Shweta Shah. Transform your health journey with our Ayurvedic and natural wellness solutions.';
  private readonly defaultKeywords =
    'nutrition, diet plan, weight loss, health, wellness, Shweta Shah, EatFit247, Ayurveda, dosha, immunity, celebrity nutritionist';
  private readonly siteUrl = 'https://eatfit24by7.com';
  private readonly defaultImage = `${this.siteUrl}/assets/images/logo.png`;
  private readonly seoPageService = inject(SeoPageService);
  private readonly platformId = inject(PLATFORM_ID);
  private isInitialNavigation = true;

  constructor(private meta: Meta, private title: Title, private router: Router) {
    this.initializeRouterListener();
  }

  /**
   * Initialize router listener to update SEO on route changes
   */
  private initializeRouterListener(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(async () => {
        // Skip initial navigation as it's handled separately
        if (this.isInitialNavigation) {
          this.isInitialNavigation = false;
          return;
        }
        await this.loadSeoForCurrentRoute();
      });
  }

  /**
   * Load SEO data for the current route
   */
  private async loadSeoForCurrentRoute(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const currentUrl = this.router.url.split('?')[0];
    const seoData = await this.seoPageService.getSeoByUrl(currentUrl);

    if (seoData && seoData.active) {
      this.updateSEOFromApiData(seoData);
    }
  }

  /**
   * Update SEO meta tags from API data (ISeoPageData)
   */
  updateSEOFromApiData(seoData: ISeoPageData): void {
    const title = seoData.metaTitle
      ? `${seoData.metaTitle} | EatFit247`
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
    this.updateMetaTag('og:site_name', 'EatFit247');

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
      ? `${data.title} | EatFit247`
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
    this.updateMetaTag('og:site_name', 'EatFit247');

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
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Handle both property and name attributes
    if (property.startsWith('og:') || property.startsWith('twitter:')) {
      // Open Graph and Twitter tags use property attribute
      if (this.meta.getTag(`property="${property}"`)) {
        this.meta.updateTag({ property, content });
      } else {
        this.meta.addTag({ property, content });
      }
    } else {
      // Standard meta tags use name attribute
      if (this.meta.getTag(`name="${property}"`)) {
        this.meta.updateTag({ name: property, content });
      } else {
        this.meta.addTag({ name: property, content });
      }
    }
  }

  /**
   * Update canonical URL
   */
  private updateCanonicalUrl(url: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    let link: HTMLLinkElement | null = document.querySelector(
      'link[rel="canonical"]'
    );

    if (link) {
      link.setAttribute('href', url);
    } else {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', url);
      document.head.appendChild(link);
    }
  }

  /**
   * Initialize SEO for the current route (call on app init)
   */
  async initializeSeo(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    await this.loadSeoForCurrentRoute();
  }
}

