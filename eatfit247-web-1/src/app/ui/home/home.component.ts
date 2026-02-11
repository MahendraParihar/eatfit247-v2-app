import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { BannerComponent } from '@shared-ui';
import { BannerService } from '../../core/services/banner.service';
import { BannerForEnum } from '@eatfit247-shared-library/enum';
import { IMediaUpload } from '@eatfit247-shared-library/core';

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [CommonModule, BannerComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private readonly bannerService = inject(BannerService);
  banners: IMediaUpload[] = [];

  async ngOnInit(): Promise<void> {
    await this.loadBannerData();
  }

  /**
   * Load banner images for Home page.
   * If no banners are returned, the banner section will stay hidden.
   */
  private async loadBannerData(): Promise<void> {
    try {
      this.banners = await this.bannerService.getBannerMediaForPage(
        BannerForEnum.HOME,
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load banner data for Home page:', error);
      this.banners = [];
    }
  }
}


