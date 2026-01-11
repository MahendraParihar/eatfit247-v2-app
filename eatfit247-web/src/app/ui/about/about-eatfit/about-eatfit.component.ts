import { Component, OnInit, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BlogSectionComponent } from '../../shared/blog-section/blog-section.component';
import { SocialLink } from '../../shared/social-icons/social-icons.component';
import { JoinShwetaShahComponent } from '../../shared/join-shweta-shah/join-shweta-shah.component';
import { ReferrerService, Partner } from '../../../services/referrer.service';
import { BannerService } from '../../../services/banner.service';
import { ImageSliderComponent, SliderItem } from '../../shared/image-slider/image-slider.component';
import { BannerForEnum } from 'eatfit247-shared-library';

@Component({
  selector: 'app-about-eatfit',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    BlogSectionComponent,
    ImageSliderComponent,
    JoinShwetaShahComponent,
  ],
  templateUrl: './about-eatfit.component.html',
  styleUrl: './about-eatfit.component.scss',
})
export class AboutEatfitComponent implements OnInit {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly referrerService = inject(ReferrerService);
  private readonly bannerService = inject(BannerService);

  // Banner items
  bannerItems: SliderItem[] = [];

  // YouTube video URL (can be set via @Input or directly)
  @Input() youtubeVideoUrl: string = 'https://www.youtube.com/embed/CDnrMp6LueA?feature=oembed';
  safeYoutubeUrl: SafeResourceUrl | null = null;

  // Partners data - loaded from API
  partners: Partner[] = [];
  isLoadingPartners = false;

  // Statistics for Knowledge & Experience section
  statistics = [
    { number: '15+', label: 'Years of experience' },
    { number: '2,000+', label: 'Happy clients' },
    { number: '100%', label: 'Satisfaction' },
    { number: '800+', label: 'Healthy recipes' },
  ];

  // Social media links for Shweta Shah section
  socialLinks: SocialLink[] = [
    {
      name: 'Facebook',
      icon: '/assets/images/social/facebook.svg',
      url: 'https://www.facebook.com/eatfit247',
    },
    {
      name: 'Twitter',
      icon: '/assets/images/social/twitter.svg',
      url: 'https://twitter.com/eatfit247',
    },
    {
      name: 'Pinterest',
      icon: '/assets/images/social/pinterest.svg',
      url: 'https://pinterest.com/eatfit247',
    },
    {
      name: 'LinkedIn',
      icon: '/assets/images/social/linkedin.svg',
      url: 'https://www.linkedin.com/company/eatfit247',
    },
    {
      name: 'Telegram',
      icon: '/assets/images/social/telegram.svg',
      url: 'https://telegram.me/eatfit247',
    },
  ];

  ngOnInit(): void {
    // Load banner data
    this.loadBannerData();

    // Sanitize YouTube URL if provided
    if (this.youtubeVideoUrl) {
      this.safeYoutubeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        this.getEmbedUrl(this.youtubeVideoUrl),
      );
    }

    // Load partners from API
    this.loadPartners();
  }

  /**
   * Load banner slider data
   */
  private async loadBannerData(): Promise<void> {
    try {
      this.bannerItems = await this.bannerService.getBannerSlidesForPage(BannerForEnum.ABOUT_US);
    } catch (error) {
      console.error('Failed to load banner data:', error);
      this.bannerItems = [];
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
   * Convert YouTube URL to embed format
   */
  private getEmbedUrl(url: string): string {
    // Handle different YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
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
    this.youtubeVideoUrl = url;
    this.safeYoutubeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.getEmbedUrl(url));
  }
}

