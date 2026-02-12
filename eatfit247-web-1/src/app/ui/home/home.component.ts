import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { BannerComponent, LoaderComponent } from '@shared-ui';
import { BannerService } from '../../core/services';
import { BannerForEnum } from '@eatfit247-shared-library/enum';
import { IMediaUpload, ISuccessStory } from '@eatfit247-shared-library/core';
import { SuccessStoriesService } from '../../core/services/success-stories.service';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { Program } from '../../core/interfaces/program.interface';
import { CommonBlogComponent } from '../common-blogs/common-blog.component';
import { CommonProgramComponent } from '../common-program/common-program.component';

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [
    CommonModule,
    BannerComponent,
    LoaderComponent,
    MatIcon,
    MatButton,
    CommonBlogComponent,
    CommonProgramComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  private readonly bannerService = inject(BannerService);
  private readonly successStoriesService = inject(SuccessStoriesService);
  readonly loading = signal(false);
  readonly programTitle = 'Nutritional Consultations & Wellness Programs';
  readonly programTagline = 'Personalised • Natural • Sustainable';
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
          note: ''
        },
        {
          programPlanId: 261,
          label: '6 Sessions',
          value: '₹67,500',
          note: ''
        },
        {
          programPlanId: 262,
          label: '8 Sessions',
          value: '₹90,000',
          note: ''
        }
      ],
      features: []
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
          note: ''
        },
        {
          programPlanId: 266,
          label: '6 Sessions',
          value: '₹30,000',
          note: ''
        },
        {
          programPlanId: null,
          label: '&nbsp;',
          value: '',
          note: ''
        }
      ],
      features: []
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
          note: ''
        },
        {
          programPlanId: null,
          label: '&nbsp;',
          value: '',
          note: ''
        },
        {
          programPlanId: null,
          label: '&nbsp;',
          value: '',
          note: ''
        }
      ],
      features: []
    }
  ];
  banners: IMediaUpload[] = [];
  stories: ISuccessStory[] = [];

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      await Promise.all([
        this.loadBannerData(),
        this.loadStories()
      ]);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Load banner images for Home page.
   * If no banners are returned, the banner section will stay hidden.
   */
  private async loadBannerData(): Promise<void> {
    this.banners = await this.bannerService.getBannerMediaForPage(
      BannerForEnum.HOME
    );
  }

  async loadStories(): Promise<void> {
    // Load stories from API
    this.stories = await this.successStoriesService.loadStories();
  }

  getStoryImage(story: ISuccessStory): string | unknown {
    return story.imagePath && story.imagePath.length > 0
      ? story.imagePath[0].webUrl
      : undefined;
  }
}


