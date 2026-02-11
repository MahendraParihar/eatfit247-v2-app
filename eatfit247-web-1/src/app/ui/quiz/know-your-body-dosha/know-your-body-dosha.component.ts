import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { BannerComponent } from '@shared-ui';
import { BannerService } from '../../../core/services/banner.service';
import { BannerForEnum } from '@eatfit247-shared-library/enum';
import { IMediaUpload } from '@eatfit247-shared-library/core';

@Component({
  standalone: true,
  selector: 'app-know-your-body-dosha',
  imports: [CommonModule, BannerComponent],
  templateUrl: './know-your-body-dosha.component.html',
  styleUrl: './know-your-body-dosha.component.scss',
})
export class KnowYourBodyDoshaComponent implements OnInit {
  private readonly bannerService = inject(BannerService);
  banners: IMediaUpload[] = [];

  async ngOnInit(): Promise<void> {
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


