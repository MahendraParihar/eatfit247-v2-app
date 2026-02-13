import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { BannerForEnum } from '@eatfit247-shared-library/enum';
import {
  BannerService,
  ReferrerService,
  HttpService, BlogService
} from '../../../core/services';
import { CardComponent, ICardData, SocialSiteItem, BannerComponent } from '@shared-ui';
import {
  IPublicBanner,
  IPublicBlog,
  IPublicReferrer,
  IPublicTableList
} from '@eatfit247-shared-library/core';
import { buildMediaUrl } from '../../../core/utils/media-url.util';
import { MatIcon } from '@angular/material/icon';

@Component({
  standalone: true,
  selector: 'app-about-eatfit',
  imports: [CommonModule, CardComponent, MatIcon, BannerComponent],
  templateUrl: './about-eatfit.component.html',
  styleUrl: './about-eatfit.component.scss',
})
export class AboutEatfitComponent implements OnInit {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly referrerService = inject(ReferrerService);
  private readonly bannerService = inject(BannerService);
  private readonly blogService = inject(BlogService);
  banners: IPublicBanner[] = [];
  safeYoutubeUrl: SafeResourceUrl | null = null;
  // Partners data - loaded from API
  partners: IPublicReferrer[] = [];
  isLoadingPartners = false;
  // Latest blog articles for "From Our Blog" section
  latestBlogs: ICardData[] = [];
  isLoadingBlogs = false;
  // Statistics for a Knowledge & Experience section
  statistics = [
    { number: '15+', label: 'Years of experience' },
    { number: '2,000+', label: 'Happy clients' },
    { number: '100%', label: 'Satisfaction' },
    { number: '800+', label: 'Healthy recipes' },
  ];
  // Social media links for Shweta Shah section
  socialLinks: SocialSiteItem[] = [
    {
      link: 'https://www.facebook.com/eatfit24by7',
      icon: 'facebook',
      type: 'external',
    },
    {
      link: 'https://www.instagram.com/eatfit24by7',
      icon: 'instagram',
      type: 'external',
    },
    {
      link: 'https://www.linkedin.com/company/eatfit24by7',
      icon: 'linkedin',
      type: 'external',
    },
    {
      link: 'https://www.pinterest.com/eatfit24by7',
      icon: 'pinterest',
      type: 'external',
    },
    {
      link: 'https://t.me/eatfit24by7',
      icon: 'telegram',
      type: 'external',
    },
    {
      link: 'https://www.youtube.com/@shwetashahEatfit247',
      icon: 'youtube',
      type: 'external',
    },
    {
      type: 'external',
      icon: 'twitter',
      link: 'https://twitter.com/eatfit247',
    },
    {
      type: 'external',
      icon: 'telegram',
      link: 'https://telegram.me/eatfit247',
    },
  ];

  ngOnInit(): void {
    // Load banner data
    this.loadBannerData();
    this.setYoutubeVideo(
      'https://www.youtube.com/embed/CDnrMp6LueA?feature=oembed'
    );
    // Load partners from API
    this.loadPartners();
    // Load latest blogs for "From Our Blog" section
    this.loadLatestBlogs();
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
      console.error('Failed to load banner data:', error);
      this.banners = [];
    }
  }

  /**
   * Load partners from the referrer API
   */
  private async loadPartners(): Promise<void> {
    this.isLoadingPartners = true;
    try {
      this.partners = await this.referrerService.getPartners();
      this.isLoadingPartners = false;
    } catch (error) {
      console.error('Error loading partners:', error);
      this.isLoadingPartners = false;
      // Keep empty array on error
      this.partners = [];
    }
  }

  /**
   * Load latest published blogs for the About page (top 3 recent).
   */
  private async loadLatestBlogs(): Promise<void> {
    this.isLoadingBlogs = true;
    try {
      const response = await this.blogService.getBlogs(0, 3);
      const blogs = response?.tableData ?? [];
      this.latestBlogs = this.blogService.mapBlogsToCards(blogs);
    } catch (error) {
      console.error('Error loading latest blogs for About page:', error);
      this.latestBlogs = [];
    } finally {
      this.isLoadingBlogs = false;
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