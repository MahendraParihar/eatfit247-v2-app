import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { BannerComponent, CardComponent, EmptyStateComponent, ICardData, LoaderComponent } from '@shared-ui';
import { BannerService } from '../../core/services/banner.service';
import { BannerForEnum } from '@eatfit247-shared-library/enum';
import { IPublicBanner, ISuccessStory } from '@eatfit247-shared-library/core';
import { SuccessStoriesService } from '../../core/services/success-stories.service';
import { JsonLdService } from '../../core/services';

@Component({
  standalone: true,
  selector: 'app-success-stories',
  imports: [CommonModule, MatChipsModule, BannerComponent, LoaderComponent, CardComponent, EmptyStateComponent],
  templateUrl: './success-stories.component.html',
  styleUrl: './success-stories.component.scss',
})
export class SuccessStoriesComponent implements OnInit {
  private readonly bannerService = inject(BannerService);
  private readonly successStoriesService = inject(SuccessStoriesService);
  private readonly jsonLdService = inject(JsonLdService);
  readonly loading = signal(false);
  banners: IPublicBanner[] = [];
  storiesByYear: Map<number, ISuccessStory[]> = new Map();
  years: number[] = [];
  totalStories = 0;
  selectedYear: number | null = null;

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
    this.banners = await this.bannerService.getBannerMediaForPage(BannerForEnum.SUCCESS_STORIES);
  }

  async loadStories(): Promise<void> {
    const allStories = await this.successStoriesService.loadStories();
    this.storiesByYear.clear();
    allStories.forEach((story: ISuccessStory) => {
      const year = new Date(story.date).getFullYear();
      if (!this.storiesByYear.has(year)) {
        this.storiesByYear.set(year, []);
      }
      this.storiesByYear.get(year)!.push(story);
    });
    this.years = Array.from(this.storiesByYear.keys()).sort((a, b) => b - a);
    this.totalStories = allStories.length;

    this.jsonLdService.setPageSchema({
      '@type': 'ItemList',
      name: 'Success Stories — EatFit247',
      itemListElement: allStories.slice(0, 10).map((story, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: story.name,
      })),
    } as Record<string, unknown>);
  }

  get filteredYears(): number[] {
    if (this.selectedYear !== null) {
      return this.years.filter((y) => y === this.selectedYear);
    }
    return this.years;
  }

  get hasStories(): boolean {
    return this.filteredYears.some((y) => this.getStoriesForYear(y).length > 0);
  }

  selectYear(year: number | null): void {
    this.selectedYear = year;
  }

  getStoriesForYear(year: number): ISuccessStory[] {
    return this.storiesByYear.get(year) || [];
  }

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
