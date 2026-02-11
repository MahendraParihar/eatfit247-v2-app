import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { BannerComponent } from '@shared-ui';
import { BannerService } from '../../core/services/banner.service';
import { BannerForEnum } from '@eatfit247-shared-library/enum';
import { IMediaUpload } from '@eatfit247-shared-library/core';

@Component({
  standalone: true,
  selector: 'app-press-and-media',
  imports: [CommonModule, BannerComponent],
  templateUrl: './press-and-media.component.html',
  styleUrl: './press-and-media.component.scss',
})
export class PressAndMediaComponent implements OnInit {
  private readonly bannerService = inject(BannerService);
  banners: IMediaUpload[] = [];

  async ngOnInit(): Promise<void> {
    await this.loadBannerData();
  }

  private async loadBannerData(): Promise<void> {
    try {
      this.banners = await this.bannerService.getBannerMediaForPage(
        BannerForEnum.MEDIA_PRESS,
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(
        'Failed to load banner data for Press & Media page:',
        error,
      );
      this.banners = [];
    }
  }
}


