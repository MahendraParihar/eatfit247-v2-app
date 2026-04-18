import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { BannerComponent } from '@shared-ui';
import { BannerService, SEOService } from '../../../core/services';
import { BannerForEnum } from '@eatfit247-shared-library/enum';
import { IPublicBanner } from '@eatfit247-shared-library/core';

@Component({
  standalone: true,
  selector: 'app-know-your-current-immunity-score',
  imports: [CommonModule, BannerComponent],
  templateUrl: './know-your-current-immunity-score.component.html',
  styleUrl: './know-your-current-immunity-score.component.scss',
})
export class KnowYourCurrentImmunityScoreComponent implements OnInit {
  private readonly bannerService = inject(BannerService);
  private readonly seoService = inject(SEOService);
  banners: IPublicBanner[] = [];

  async ngOnInit(): Promise<void> {
    this.seoService.updateSEO({ title: 'Know Your Current Immunity Score', description: 'Assess your immunity level with our interactive quiz and get personalized tips to boost your immune system.', url: '/know-your-current-immunity-score' });
    await this.loadBannerData();
  }

  private async loadBannerData(): Promise<void> {
    try {
      this.banners = await this.bannerService.getBannerMediaForPage(
        BannerForEnum.QUIZ_IMMUNITY
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(
        'Failed to load banner data for Know Your Current Immunity Score page:',
        error
      );
      this.banners = [];
    }
  }
}


