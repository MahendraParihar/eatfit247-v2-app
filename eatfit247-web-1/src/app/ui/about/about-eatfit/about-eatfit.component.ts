import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { BannerForEnum } from '@eatfit247-shared-library/enum';
import { BannerService, ReferrerService } from '../../../core/services';
import { BannerComponent, LoaderComponent, SocialSiteItem } from '@shared-ui';
import { IPublicBanner, IPublicReferrer } from '@eatfit247-shared-library/core';
import { buildMediaUrl } from '../../../core/utils/media-url.util';
import { MatIcon } from '@angular/material/icon';
import { CommonBlogComponent } from '../../common-blogs/common-blog.component';

@Component({
  standalone: true,
  selector: 'app-about-eatfit',
  imports: [CommonModule, MatIcon, BannerComponent, CommonBlogComponent, LoaderComponent],
  templateUrl: './about-eatfit.component.html',
  styleUrl: './about-eatfit.component.scss'
})
export class AboutEatfitComponent implements OnInit {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly referrerService = inject(ReferrerService);
  private readonly bannerService = inject(BannerService);
  readonly loading = signal(false);
  banners: IPublicBanner[] = [];
  safeYoutubeUrl: SafeResourceUrl | null = null;
  // Partners data - loaded from API
  partners: IPublicReferrer[] = [];
  // Statistics for a Knowledge & Experience section
  statistics = [
    { number: '15+', label: 'Years of experience' },
    { number: '2,000+', label: 'Happy clients' },
    { number: '100%', label: 'Satisfaction' },
    { number: '800+', label: 'Healthy recipes' }
  ];
  // Social media links for Shweta Shah section
  socialLinks: SocialSiteItem[] = [
    {
      link: 'https://www.facebook.com/eatfit24by7',
      icon: 'facebook',
      type: 'external'
    },
    {
      link: 'https://www.instagram.com/eatfit24by7',
      icon: 'instagram',
      type: 'external'
    },
    {
      link: 'https://www.linkedin.com/company/eatfit24by7',
      icon: 'linkedin',
      type: 'external'
    },
    {
      link: 'https://www.pinterest.com/eatfit24by7',
      icon: 'pinterest',
      type: 'external'
    },
    {
      link: 'https://t.me/eatfit24by7',
      icon: 'telegram',
      type: 'external'
    },
    {
      link: 'https://www.youtube.com/@shwetashahEatfit247',
      icon: 'youtube',
      type: 'external'
    },
    {
      type: 'external',
      icon: 'twitter',
      link: 'https://twitter.com/eatfit247'
    },
    {
      type: 'external',
      icon: 'telegram',
      link: 'https://telegram.me/eatfit247'
    }
  ];

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      await Promise.all([this.loadBannerData(), this.loadPartners()]);
      this.setYoutubeVideo(
        'https://www.youtube.com/embed/CDnrMp6LueA?feature=oembed'
      );
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Load banner slider data
   */
  private async loadBannerData(): Promise<void> {
    try {
      this.banners = await this.bannerService.getBannerMediaForPage(
        BannerForEnum.ABOUT_US
      );
    } catch (error) {
      this.banners = [];
    }
  }

  /**
   * Load partners from the referrer API
   */
  private async loadPartners(): Promise<void> {
    try {
      this.partners = await this.referrerService.getPartners();
    } catch (error) {
      this.partners = [];
    }
  }

  /**
   * Convert YouTube URL to embed format
   */
  private getEmbedUrl(url: string): string {
    // Handle different YouTube URL formats
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
   * Set YouTube video URL (can be called from parent or set directly)
   */
  setYoutubeVideo(url: string): void {
    this.safeYoutubeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      this.getEmbedUrl(url)
    );
  }

  buildWebUrl(referrer: IPublicReferrer) {
    const firstImage =
      referrer.logo && referrer.logo.length > 0 ? referrer.logo[0] : null;
    return buildMediaUrl(firstImage?.webUrl);
  }
}