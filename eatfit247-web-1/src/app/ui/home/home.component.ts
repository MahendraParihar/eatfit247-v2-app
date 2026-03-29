import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { BannerComponent, LoaderComponent } from '@shared-ui';
import { BannerService } from '../../core/services';
import { BannerForEnum } from '@eatfit247-shared-library/enum';
import { IPublicBanner, ISuccessStory } from '@eatfit247-shared-library/core';
import { SuccessStoriesService } from '../../core/services/success-stories.service';
import { CommonBlogComponent } from '../common-blogs/common-blog.component';
import { CommonProgramComponent } from '../common-program/common-program.component';
import { HomeHallOfFameComponent } from './home-hall-of-fame/home-hall-of-fame.component';

interface TrustStat {
  value: string;
  label: string;
}

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [
    CommonModule,
    MatButtonModule,
    BannerComponent,
    LoaderComponent,
    CommonBlogComponent,
    CommonProgramComponent,
    HomeHallOfFameComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private readonly bannerService = inject(BannerService);
  private readonly successStoriesService = inject(SuccessStoriesService);
  readonly loading = signal(false);
  banners: IPublicBanner[] = [];
  stories: ISuccessStory[] = [];

  readonly trustStats: TrustStat[] = [
    { value: '5000+', label: 'Clients Transformed' },
    { value: '16+', label: 'Years of Expertise' },
    { value: '100%', label: 'Natural Ingredients' },
    { value: '4.9★', label: 'Average Rating' },
  ];

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      await Promise.all([this.loadBannerData(), this.loadStories()]);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadBannerData(): Promise<void> {
    this.banners = await this.bannerService.getBannerMediaForPage(
      BannerForEnum.HOME,
    );
  }

  async loadStories(): Promise<void> {
    this.stories = await this.successStoriesService.loadStories();
  }
}
