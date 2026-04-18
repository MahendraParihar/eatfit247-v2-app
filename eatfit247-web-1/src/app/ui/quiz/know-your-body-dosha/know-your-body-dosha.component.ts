import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { BannerComponent } from '@shared-ui';
import { BannerService } from '../../../core/services/banner.service';
import { SEOService } from '../../../core/services';
import { BannerForEnum } from '@eatfit247-shared-library/enum';
import { IPublicBanner } from '@eatfit247-shared-library/core';

@Component({
  standalone: true,
  selector: 'app-know-your-body-dosha',
  imports: [CommonModule, BannerComponent],
  templateUrl: './know-your-body-dosha.component.html',
  styleUrl: './know-your-body-dosha.component.scss',
})
export class KnowYourBodyDoshaComponent implements OnInit {
  private readonly bannerService = inject(BannerService);
  private readonly seoService = inject(SEOService);
  banners: IPublicBanner[] = [];

  async ngOnInit(): Promise<void> {
    this.seoService.updateSEO({ title: 'Know Your Body Dosha', description: 'Discover your Ayurvedic body type with our interactive dosha quiz and get personalized nutrition recommendations.', url: '/know-your-body-dosha' });
    await this.loadBannerData();
  }

  private async loadBannerData(): Promise<void> {
    try {
      this.banners = await this.bannerService.getBannerMediaForPage(
        BannerForEnum.QUIZ_DOSHA,
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(
        'Failed to load banner data for Know Your Body Dosha page:',
        error,
      );
      this.banners = [];
    }
  }
}


