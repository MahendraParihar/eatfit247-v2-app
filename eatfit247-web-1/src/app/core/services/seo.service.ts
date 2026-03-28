import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
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
  private readonly defaultTitle = 'EatFit247 | Diet Consultancy & Wellness by Shweta Shah';
  private readonly defaultDescription =
    'EatFit247 offers personalized nutrition plans, diet consultancy, and the Debloat powder by celebrity nutritionist Shweta Shah. Transform your health with Ayurvedic and science-backed wellness solutions.';
  private readonly defaultKeywords =
    'diet consultancy, nutrition plan, weight loss, Shweta Shah, EatFit247, Debloat powder, gut health, Ayurveda, wellness, PCOD, thyroid diet, celebrity nutritionist';
  private readonly siteUrl = 'https://eatfit24by7.com';
  private readonly defaultImage = `${this.siteUrl}/assets/images/logo.png`;
  private readonly seoPageService = inject(SeoPageService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private isInitialNavigation = true;

  constructor(private meta: Meta, private title: Title, private router: Router) {
    this.initializeRouterListener();
  }

  private initializeRouterListener(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(async () => {
        if (this.isInitialNavigation) {
          this.isInitialNavigation = false;
          return;
        }
        await this.loadSeoForCurrentRoute();
      });
  }

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
   * Update SEO meta tags from API data (ISeoPageData).
   * Uses CMS og:image when available, falls back to default.
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
    const ogImage = (seoData as ISeoPageData & { ogImage?: string }).ogImage ?? this.defaultImage;

    this.title.setTitle(title);

    this.updateMetaTag('description', description);

    this.updateMetaTag('og:title', ogTitle);
    this.updateMetaTag('og:description', ogDescription);
    this.updateMetaTag('og:image', ogImage);
    this.updateMetaTag('og:url', ogUrl);
    this.updateMetaTag('og:type', ogType);
    this.updateMetaTag('og:site_name', 'EatFit247');

    this.updateMetaTag('twitter:card', twitterCard);
    this.updateMetaTag('twitter:title', ogTitle);
    this.updateMetaTag('twitter:description', ogDescription);
    this.updateMetaTag('twitter:image', ogImage);

    this.updateCanonicalUrl(canonicalUrl);
  }

  /**
   * Update SEO meta tags for non-API flows (product, blog detail, etc.).
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

    this.title.setTitle(title);

    this.updateMetaTag('description', description);
    this.updateMetaTag('keywords', keywords);

    this.updateMetaTag('og:title', title);
    this.updateMetaTag('og:description', description);
    this.updateMetaTag('og:image', image);
    this.updateMetaTag('og:url', url);
    this.updateMetaTag('og:type', type);
    this.updateMetaTag('og:site_name', 'EatFit247');

    this.updateMetaTag('twitter:card', 'summary_large_image');
    this.updateMetaTag('twitter:title', title);
    this.updateMetaTag('twitter:description', description);
    this.updateMetaTag('twitter:image', image);

    this.updateCanonicalUrl(url);
  }

  /**
   * Update or create a meta tag. SSR-safe via Angular Meta service.
   */
  private updateMetaTag(property: string, content: string): void {
    if (property.startsWith('og:') || property.startsWith('twitter:')) {
      if (this.meta.getTag(`property="${property}"`)) {
        this.meta.updateTag({ property, content });
      } else {
        this.meta.addTag({ property, content });
      }
    } else {
      if (this.meta.getTag(`name="${property}"`)) {
        this.meta.updateTag({ name: property, content });
      } else {
        this.meta.addTag({ name: property, content });
      }
    }
  }

  /**
   * Update canonical URL. Uses DOCUMENT token (works in SSR and browser).
   */
  private updateCanonicalUrl(url: string): void {
    let link = this.document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;

    if (link) {
      link.setAttribute('href', url);
    } else {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', url);
      this.document.head.appendChild(link);
    }
  }

  /**
   * Initialize SEO for the current route (call on app init).
   * API-fetching is browser-only; meta/title/canonical updates are SSR-safe.
   */
  async initializeSeo(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    await this.loadSeoForCurrentRoute();
  }
}
