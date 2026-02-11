import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { BannerComponent } from '@shared-ui';
import { BannerService } from '../../core/services/banner.service';
import { BannerForEnum } from '@eatfit247-shared-library/enum';
import { IMediaUpload } from '@eatfit247-shared-library/core';

interface ProgramPriceLine {
  programPlanId: number;
  label: string;
  value: string;
  note?: string;
}

interface Program {
  id: string;
  name: string;
  subtitle: string;
  prices: ProgramPriceLine[];
  features: string[];
}

@Component({
  standalone: true,
  selector: 'app-our-programs',
  imports: [CommonModule, MatButton, BannerComponent],
  templateUrl: './our-programs.component.html',
  styleUrl: './our-programs.component.scss',
})
export class OurProgramsComponent implements OnInit {
  private readonly bannerService = inject(BannerService);
  banners: IMediaUpload[] = [];
  readonly pageTitle = 'Nutritional Consultations & Wellness Programs';
  readonly pageTagline = 'Personalised • Natural • Sustainable';
  readonly programs: Program[] = [
    {
      id: 'exclusive-shweta',
      name: 'Exclusively with Shweta Shah',
      subtitle: 'Personalised journey with expert guidance',
      prices: [
        {
          programPlanId: 263,
          label: '1 session',
          value: '₹20,000',
          note: '',
        },
        {
          programPlanId: 261,
          label: '6 Sessions',
          value: '₹67,500',
          note: '',
        },
        {
          programPlanId: 262,
          label: '8 Sessions',
          value: '₹90,000',
          note: '',
        },
      ],
      features: [
        'One-on-one consultation with Shweta Shah',
        'Comprehensive health assessment',
        'Personalized nutrition plan',
        'Detailed dietary recommendations',
        'Follow-up guidelines',
      ],
    },
    {
      id: 'chief-nutritionist',
      name: 'Plan with Chief Nutritionist',
      subtitle: 'Experience of 16 years',
      prices: [
        {
          programPlanId: 239,
          label: '3 Sessions',
          value: '₹15,000',
          note: '',
        },
        {
          programPlanId: 266,
          label: '6 Sessions',
          value: '₹30,000',
          note: '',
        },
        {
          programPlanId: null,
          label: '&nbsp;',
          value: '',
          note: '',
        },
      ],
      features: [
        'One-on-one consultation with Shweta Shah',
        'Comprehensive health assessment',
        'Personalized nutrition plan',
        'Detailed dietary recommendations',
        'Follow-up guidelines',
      ],
    },
    {
      id: 'shweta-and-team',
      name: 'Plan with Shweta + Team',
      subtitle: 'Collaborative approach',
      prices: [
        {
          programPlanId: 264,
          label: '1+7 Sessions',
          value: '₹55,000',
          note: '',
        },
        {
          programPlanId: null,
          label: '&nbsp;',
          value: '',
          note: '',
        },
        {
          programPlanId: null,
          label: '&nbsp;',
          value: '',
          note: '',
        },
      ],
      features: [
        'Initial consultation with Shweta',
        '7 follow-up Sessions with team',
        'Personalized nutrition plan',
        'Detailed dietary recommendations',
        'Follow-up guidelines',
      ],
    },
  ];
  readonly termsAndConditions: string[] = [
    'Payments are non-refundable & non-transferable',
    'Program is valid only for the registered individual',
    'Pause upto 20 days may be approved in genuine cases',
    'Prices are valid till 31st Dec, 2026.',
    '**Prices are inclusive of Tax, tax will be charged on final payment.',
  ];

  async ngOnInit(): Promise<void> {
    await this.loadBannerData();
  }

  private async loadBannerData(): Promise<void> {
    try {
      this.banners = await this.bannerService.getBannerMediaForPage(
        BannerForEnum.OUR_PROGRAM,
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(
        'Failed to load banner data for Our Programs page:',
        error,
      );
      this.banners = [];
    }
  }
}

