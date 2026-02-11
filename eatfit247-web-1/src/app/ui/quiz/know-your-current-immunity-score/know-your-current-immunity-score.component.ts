import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { BannerComponent } from '@shared-ui';
import { BannerService } from '../../../core/services/banner.service';
import { BannerForEnum } from '@eatfit247-shared-library/enum';
import { IMediaUpload } from '@eatfit247-shared-library/core';

@Component({
  standalone: true,
  selector: 'app-know-your-current-immunity-score',
  imports: [CommonModule, BannerComponent],
  templateUrl: './know-your-current-immunity-score.component.html',
  styleUrl: './know-your-current-immunity-score.component.scss',
})
export class KnowYourCurrentImmunityScoreComponent implements OnInit {
  private readonly bannerService = inject(BannerService);
  banners: IMediaUpload[] = [];

  async ngOnInit(): Promise<void> {
    await this.loadBannerData();
  }

  private async loadBannerData(): Promise<void> {
    try {
      this.banners = await this.bannerService.getBannerMediaForPage(
        BannerForEnum.QUIZ_IMMUNITY,
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(
        'Failed to load banner data for Know Your Current Immunity Score page:',
        error,
      );
      this.banners = [];
    }
  }
}


