import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SuccessStoriesService, SuccessStory } from '../../services/success-stories.service';
import { BannerService } from '../../services/banner.service';
import { ImageSliderComponent, SliderItem } from '../shared/image-slider/image-slider.component';
import { BannerForEnum } from 'eatfit247-shared-library';

/**
 * Success Stories Component
 * Displays success stories in a timeline layout
 */
@Component({
  selector: 'app-success-stories',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    ImageSliderComponent,
  ],
  templateUrl: './success-stories.component.html',
  styleUrl: './success-stories.component.scss',
})
export class SuccessStoriesComponent implements OnInit {
  private readonly successStoriesService = inject(SuccessStoriesService);
  private readonly bannerService = inject(BannerService);

  bannerItems: SliderItem[] = [];
  storiesByYear: Map<number, SuccessStory[]> = new Map();
  years: number[] = [];
  totalStories = 0;

  ngOnInit(): void {
    this.loadBannerData();
    this.loadStories();
  }

  /**
   * Load banner slider data
   */
  private async loadBannerData(): Promise<void> {
    try {
      this.bannerItems = await this.bannerService.getBannerSlidesForPage(BannerForEnum.SUCCESS_STORIES);
    } catch (error) {
      console.error('Failed to load banner data:', error);
      this.bannerItems = [];
    }
  }

  /**
   * Load all success stories grouped by year
   */
  loadStories(): void {
    const allStories = this.successStoriesService.getAllStories();
    this.years = this.successStoriesService.getAllYears();
    this.totalStories = this.successStoriesService.getTotalStories();

    // Group stories by year
    this.storiesByYear.clear();
    allStories.forEach((story) => {
      if (!this.storiesByYear.has(story.year)) {
        this.storiesByYear.set(story.year, []);
      }
      this.storiesByYear.get(story.year)!.push(story);
    });
  }

  /**
   * Get stories for a specific year
   */
  getStoriesForYear(year: number): SuccessStory[] {
    return this.storiesByYear.get(year) || [];
  }

  /**
   * Check if story should have image on left (alternating pattern)
   */
  isImageLeft(storyIndex: number): boolean {
    return storyIndex % 2 === 0;
  }

  /**
   * Handle image loading errors
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    // Try fallback to a generic placeholder or use a data URI
    img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjOTk5Ij5JbWFnZSBub3QgYXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==';
    img.onerror = null; // Prevent infinite loop
  }
}
