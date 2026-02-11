import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { BannerComponent } from '@shared-ui';
import { BannerService } from '../../core/services/banner.service';
import { BannerForEnum } from '@eatfit247-shared-library/enum';
import { IMediaUpload } from '@eatfit247-shared-library/core';

@Component({
  standalone: true,
  selector: 'app-success-stories',
  imports: [CommonModule, BannerComponent],
  templateUrl: './success-stories.component.html',
  styleUrl: './success-stories.component.scss',
})
export class SuccessStoriesComponent implements OnInit {
  private readonly bannerService = inject(BannerService);
  banners: IMediaUpload[] = [];

  async ngOnInit(): Promise<void> {
    await this.loadBannerData();
  }

  private async loadBannerData(): Promise<void> {
    try {
      this.banners = await this.bannerService.getBannerMediaForPage(
        BannerForEnum.SUCCESS_STORIES,
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(
        'Failed to load banner data for Success Stories page:',
        error,
      );
      this.banners = [];
    }
  }
}


