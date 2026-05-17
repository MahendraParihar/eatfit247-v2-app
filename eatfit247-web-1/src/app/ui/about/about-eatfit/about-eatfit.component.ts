import { Component, inject, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { BannerForEnum } from '@eatfit247-shared-library/enum';
import { BannerService, JsonLdService, SEOService } from '../../../core/services';
import { BannerComponent, BreadcrumbsComponent, LoaderComponent } from '@shared-ui';
import { IPublicBanner } from '@eatfit247-shared-library/core';
import { RouterLink } from '@angular/router';

interface StatItem {
  number: string;
  label: string;
}

@Component({
  standalone: true,
  selector: 'app-about-eatfit',
  imports: [RouterLink, BannerComponent, LoaderComponent, BreadcrumbsComponent],
  templateUrl: './about-eatfit.component.html',
  styleUrl: './about-eatfit.component.scss'
})
export class AboutEatfitComponent implements OnInit {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly bannerService = inject(BannerService);
  private readonly jsonLdService = inject(JsonLdService);
  private readonly seoService = inject(SEOService);
  readonly loading = signal(false);
  banners: IPublicBanner[] = [];
  safeYoutubeUrl: SafeResourceUrl | null = null;

  // Key headline statistics shown in the story column
  stats: StatItem[] = [
    { number: '24', label: 'Years of practice' },
    { number: '3000+', label: 'Clients guided' }
  ];

  // Pillars / brief value bullets
  pillars: string[] = [
    'Industry, corporate, media & fitness leaders',
    'Plans built around your real lifestyle',
    'Natural, food-first methodology — no extremes'
  ];

  async ngOnInit(): Promise<void> {
    this.seoService.updateSEO({ title: 'About EatFit247', description: 'EatFit247 is a holistic nutrition and wellness platform offering personalized diet plans and health coaching.', url: '/about-us' });
    this.loading.set(true);
    try {
      await this.loadBannerData();
      this.setYoutubeVideo(
        'https://www.youtube.com/watch?v=YoHc6piJjt4'
      );
    } finally {
      this.loading.set(false);
    }
    this.jsonLdService.setPageSchema({
      '@type': 'Organization',
      name: 'EatFit247',
      url: 'https://eatfit24by7.com',
      logo: 'https://eatfit24by7.com/logo-white.svg',
      description: 'EatFit247 is a holistic nutrition and wellness platform founded by celebrity nutritionist Shweta Shah, offering personalised diet consultancy and natural wellness products.',
      sameAs: [
        'https://www.instagram.com/shwetashah_eatfit247',
        'https://www.facebook.com/eatfit247',
        'https://www.youtube.com/@EatFit247',
      ],
    } as Record<string, unknown>);
  }

  /**
   * Load banner slider data
   */
  private async loadBannerData(): Promise<void> {
    try {
      this.banners = await this.bannerService.getBannerMediaForPage(
        BannerForEnum.ABOUT_US
      );
    } catch (_error) {
      this.banners = [];
    }
  }

  /**
   * Convert YouTube URL to embed format
   */
  private getEmbedUrl(url: string): string {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = match && match[2].length === 11 ? match[2] : null;
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  }

  /**
   * Set YouTube video URL
   */
  setYoutubeVideo(url: string): void {
    this.safeYoutubeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      this.getEmbedUrl(url)
    );
  }
}
