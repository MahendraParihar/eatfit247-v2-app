import { Component, inject, OnInit } from '@angular/core';
import { BaseLayoutComponent } from './ui/base-layout/base-layout.component';
import { SEOService } from './services/seo.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [BaseLayoutComponent],
  template: `<app-base-layout />`,
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private seoService = inject(SEOService);

  ngOnInit(): void {
    // Initialize default SEO
    this.seoService.updateSEO({
      title: 'EatFit24By7 - Your Health & Wellness Partner',
      description:
        'EatFit24By7 offers personalized nutrition plans, health programs, and expert guidance from celebrity nutritionist Shweta Shah. Transform your health journey with our Ayurvedic and natural wellness solutions.',
    });

    // Add organization structured data
    this.seoService.addOrganizationStructuredData();

    // Add website structured data
    this.seoService.addWebsiteStructuredData();
  }
}
