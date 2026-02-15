import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { BannerComponent, CardComponent, ICardData, LoaderComponent } from '@shared-ui';
import { BannerService } from '../../core/services/banner.service';
import { BannerForEnum } from '@eatfit247-shared-library/enum';
import { IPublicBanner, ISuccessStory } from '@eatfit247-shared-library/core';
import { SuccessStoriesService } from '../../core/services/success-stories.service';

@Component({
  standalone: true,
  selector: 'app-success-stories',
  imports: [CommonModule, BannerComponent, LoaderComponent, CardComponent],
  templateUrl: './success-stories.component.html',
  styleUrl: './success-stories.component.scss',
})
export class SuccessStoriesComponent implements OnInit {
  private readonly bannerService = inject(BannerService);
  private readonly successStoriesService = inject(SuccessStoriesService);
  readonly loading = signal(false);
  banners: IPublicBanner[] = [];
  storiesByYear: Map<number, ISuccessStory[]> = new Map();
  years: number[] = [];
  totalStories = 0;

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      await this.loadBannerData();
      await this.loadStories();
    } finally {
      this.loading.set(false);
    }
  }

  private async loadBannerData(): Promise<void> {
    this.banners = await this.bannerService.getBannerMediaForPage(
      BannerForEnum.SUCCESS_STORIES
    );
  }

  async loadStories(): Promise<void> {
    // Load stories from API
    const allStories = await this.successStoriesService.loadStories();
    // Group stories by year
    this.storiesByYear.clear();
    allStories.forEach((story: ISuccessStory) => {
      const year = new Date(story.date).getFullYear();
      if (!this.storiesByYear.has(year)) {
        this.storiesByYear.set(year, []);
      }
      this.storiesByYear.get(year)!.push(story);
    });
    // Update years array and total count
    this.years = Array.from(this.storiesByYear.keys()).sort((a, b) => a - b);
    this.totalStories = allStories.length;
  }

  /**
   * Get stories for a specific year
   */
  getStoriesForYear(year: number): ISuccessStory[] {
    return this.storiesByYear.get(year) || [];
  }

  /**
   * Convert success story to card data
   */
  mapToCardData(story: ISuccessStory): ICardData {
    return {
      id: story.successStoryId,
      title: story.name,
      summary: story.description,
      imageUrl:
        story.imagePath && story.imagePath.length > 0
          ? story.imagePath[0].webUrl
          : undefined,
      date: story.date,
      category: undefined,
    };
  }
}


