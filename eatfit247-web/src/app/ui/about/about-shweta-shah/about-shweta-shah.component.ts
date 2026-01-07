import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ImageSliderComponent, SliderItem } from '../../shared/image-slider/image-slider.component';
import { SocialIconsComponent, SocialLink } from '../../shared/social-icons/social-icons.component';
import { BannerService } from '../../../services/banner.service';
import { BannerForEnum } from 'eatfit247-shared-library';

@Component({
  selector: 'app-about-shweta-shah',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    ImageSliderComponent,
    SocialIconsComponent,
  ],
  templateUrl: './about-shweta-shah.component.html',
  styleUrl: './about-shweta-shah.component.scss',
})
export class AboutShwetaShahComponent implements OnInit {
  private readonly bannerService = inject(BannerService);

  bannerItems: SliderItem[] = [];
  
  // Social media links
  socialLinks: SocialLink[] = [
    {
      name: 'Facebook',
      icon: '/assets/images/social/facebook.svg',
      url: 'https://www.facebook.com/sharer/sharer.php?u=https://eatfit24by7.com/about-shweta-shah/',
    },
    {
      name: 'Twitter',
      icon: '/assets/images/social/twitter.svg',
      url: 'https://twitter.com/share?url=https://eatfit24by7.com/about-shweta-shah/',
    },
    {
      name: 'Telegram',
      icon: '/assets/images/social/telegram.svg',
      url: 'https://telegram.me/share/url?url=https://eatfit24by7.com/about-shweta-shah/',
    },
    {
      name: 'YouTube',
      icon: '/assets/images/social/youtube.svg',
      url: 'https://www.youtube.com/@shwetashahEatfit247',
    },
    {
      name: 'Pinterest',
      icon: '/assets/images/social/pinterest.svg',
      url: 'https://pinterest.com/pin/create/button/?url=https://eatfit24by7.com/about-shweta-shah/&media=https://eatfit24by7.com/wp-includes/images/media/default.svg',
    },
    {
      name: 'LinkedIn',
      icon: '/assets/images/social/linkedin.svg',
      url: 'https://www.linkedin.com/shareArticle?mini=true&url=https://eatfit24by7.com/about-shweta-shah/',
    },
  ];

  ngOnInit(): void {
    this.loadBannerData();
  }

  /**
   * Load banner slider data
   */
  private loadBannerData(): void {
    this.bannerService.getBannerSlidesForPage(BannerForEnum.ABOUT_SHWETA).subscribe({
      next: (items) => {
        this.bannerItems = items;
      },
      error: (error) => {
        console.error('Failed to load banner data:', error);
        this.bannerItems = [];
      },
    });
  }
}

