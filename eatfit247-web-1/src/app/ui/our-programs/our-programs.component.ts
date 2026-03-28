import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { BannerComponent } from '@shared-ui';
import { BannerService } from '../../core/services/banner.service';
import { BannerForEnum } from '@eatfit247-shared-library/enum';
import { IPublicBanner } from '@eatfit247-shared-library/core';
import { CommonProgramComponent } from '../common-program/common-program.component';
import { JsonLdService } from '../../core/services';

@Component({
  standalone: true,
  selector: 'app-our-programs',
  imports: [CommonModule, MatExpansionModule, MatIconModule, BannerComponent, CommonProgramComponent],
  templateUrl: './our-programs.component.html',
  styleUrl: './our-programs.component.scss'
})
export class OurProgramsComponent implements OnInit {
  private readonly bannerService = inject(BannerService);
  private readonly jsonLdService = inject(JsonLdService);
  banners: IPublicBanner[] = [];

  readonly howItWorksSteps = [
    {
      number: '1',
      title: 'Book a Session',
      desc: 'Choose the plan that fits your goals and complete a secure checkout in minutes.',
      icon: 'calendar_month',
    },
    {
      number: '2',
      title: 'Get Your Plan',
      desc: 'Receive a personalised Ayurvedic nutrition plan tailored to your body type and health goals.',
      icon: 'assignment',
    },
    {
      number: '3',
      title: 'Transform',
      desc: 'Follow your expert-guided plan with regular follow-ups and achieve lasting wellness.',
      icon: 'stars',
    },
  ];

  readonly termsAndConditions: string[] = [
    'Payments are non-refundable & non-transferable',
    'Program is valid only for the registered individual',
    'Pause upto 20 days may be approved in genuine cases',
    'Prices are valid till 31st Dec, 2026.',
    '**Prices are exclusive of Tax, tax will be charged on final payment.'
  ];

  async ngOnInit(): Promise<void> {
    await this.loadBannerData();
    this.jsonLdService.setPageSchema(
      this.jsonLdService.buildBreadcrumb([
        { name: 'Home', url: 'https://eatfit24by7.com/' },
        { name: 'Programs', url: 'https://eatfit24by7.com/our-programs' },
      ])
    );
  }

  private async loadBannerData(): Promise<void> {
    try {
      this.banners = await this.bannerService.getBannerMediaForPage(BannerForEnum.OUR_PROGRAM);
    } catch (error) {
      console.error('Failed to load banner data for Our Programs page:', error);
      this.banners = [];
    }
  }
}
