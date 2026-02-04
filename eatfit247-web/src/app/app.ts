import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseLayoutComponent } from './ui/base-layout/base-layout.component';
import { SEOService } from './services/seo.service';
import { SeoPageService } from './services/seo-page.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [BaseLayoutComponent],
  template: `<app-base-layout />`,
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private seoService = inject(SEOService);
  private seoPageService = inject(SeoPageService);
  private router = inject(Router);

  async ngOnInit(): Promise<void> {
    // Load SEO data for initial route
    await this.loadInitialSeo();

    // Add organization structured data
    this.seoService.addOrganizationStructuredData();

    // Add website structured data
    this.seoService.addWebsiteStructuredData();
  }

  /**
   * Load SEO data for the initial route
   */
  private async loadInitialSeo(): Promise<void> {
    const currentUrl = this.router.url.split('?')[0]; // Remove query params
    const seoData = await this.seoPageService.getSeoByUrl(currentUrl);
    
    if (seoData && seoData.active) {
      this.seoService.updateSEOFromApiData(seoData);
    } else {
      // Fallback to default SEO if no data found
      this.seoService.updateSEO({
        title: 'EatFit24By7 - Your Health & Wellness Partner',
        description:
          'EatFit24By7 offers personalized nutrition plans, health programs, and expert guidance from celebrity nutritionist Shweta Shah. Transform your health journey with our Ayurvedic and natural wellness solutions.',
      });
    }
  }
}
