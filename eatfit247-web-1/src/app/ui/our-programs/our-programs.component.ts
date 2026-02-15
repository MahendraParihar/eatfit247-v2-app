import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { BannerComponent } from '@shared-ui';
import { BannerService } from '../../core/services/banner.service';
import { BannerForEnum } from '@eatfit247-shared-library/enum';
import { IPublicBanner } from '@eatfit247-shared-library/core';
import { CommonProgramComponent } from '../common-program/common-program.component';

@Component({
  standalone: true,
  selector: 'app-our-programs',
  imports: [CommonModule, BannerComponent, CommonProgramComponent],
  templateUrl: './our-programs.component.html',
  styleUrl: './our-programs.component.scss'
})
export class OurProgramsComponent implements OnInit {
  private readonly bannerService = inject(BannerService);
  banners: IPublicBanner[] = [];
  readonly termsAndConditions: string[] = [
    'Payments are non-refundable & non-transferable',
    'Program is valid only for the registered individual',
    'Pause upto 20 days may be approved in genuine cases',
    'Prices are valid till 31st Dec, 2026.',
    '**Prices are exclusive of Tax, tax will be charged on final payment.'
  ];

  async ngOnInit(): Promise<void> {
    await this.loadBannerData();
  }

  private async loadBannerData(): Promise<void> {
    try {
      this.banners = await this.bannerService.getBannerMediaForPage(
        BannerForEnum.OUR_PROGRAM
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load banner data for Our Programs page:', error);
      this.banners = [];
    }
  }
}

