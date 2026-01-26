import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SuccessStoriesService } from '../../services/success-stories.service';
import { BannerService } from '../../services/banner.service';
import { ImageSliderComponent, SliderItem } from '../shared/image-slider/image-slider.component';
import { BannerForEnum, IGoogleReview, ISuccessStory } from 'eatfit247-shared-library';
import { GoogleReviewsService } from '../../services/google-reviews.service';

/**
 * Success Stories Component
 * Displays success stories in a timeline layout
 */
@Component({
  selector: 'app-success-stories',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, ImageSliderComponent],
  templateUrl: './success-stories.component.html',
  styleUrl: './success-stories.component.scss'
})
export class SuccessStoriesComponent implements OnInit {
  private readonly successStoriesService = inject(SuccessStoriesService);
  private readonly bannerService = inject(BannerService);
  private readonly googleReviewsService = inject(GoogleReviewsService);
  private readonly router = inject(Router);
  bannerItems: SliderItem[] = [];
  storiesByYear: Map<number, ISuccessStory[]> = new Map();
  years: number[] = [];
  totalStories = 0;
  isLoading = false;
  isLoadingReviews = false;
  hasError = false;
  hasReviewsError = false;
  googleReviews: IGoogleReview[] = [];

  ngOnInit(): void {
    this.loadBannerData();
    this.loadStories();
    // this.loadGoogleReviews();
  }

  /**
   * Load banner slider data
   */
  private async loadBannerData(): Promise<void> {
    try {
      this.bannerItems = await this.bannerService.getBannerSlidesForPage(
        BannerForEnum.SUCCESS_STORIES
      );
    } catch (error) {
      console.error('Failed to load banner data:', error);
      this.bannerItems = [];
    }
  }

  /**
   * Load all success stories grouped by year from API
   */
  async loadStories(): Promise<void> {
    this.isLoading = true;
    this.hasError = false;
    try {
      // Load stories from API
      const allStories = await this.successStoriesService.loadStories();
      console.log(allStories);
      // Group stories by year
      this.storiesByYear.clear();
      allStories.forEach((story: ISuccessStory) => {
        const year = new Date(story.date).getFullYear();
        if (!this.storiesByYear.has(year)) {
          this.storiesByYear.set(year, []);
        }
        this.storiesByYear.get(year)!.push(story);
        console.log(this.storiesByYear);
      });
      // Update years array and total count
      this.years = Array.from(this.storiesByYear.keys());
      this.totalStories = allStories.length;
    } catch (error) {
      console.error('Failed to load success stories:', error);
      this.hasError = true;
      this.storiesByYear.clear();
      this.years = [];
      this.totalStories = 0;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Get stories for a specific year
   */
  getStoriesForYear(year: number): ISuccessStory[] {
    return this.storiesByYear.get(year) || [];
  }

  async loadGoogleReviews(): Promise<void> {
    this.isLoadingReviews = true;
    this.hasReviewsError = false;
    try {
      const res = await this.googleReviewsService.loadReviews();
      if (res && res.reviews && res.reviews.length > 0) {
        this.googleReviews = res.reviews as Array<IGoogleReview>;
      } else {
        this.googleReviews = [];
      }
    } catch (error) {
      console.error('Failed to load Google reviews:', error);
      this.hasReviewsError = true;
      this.googleReviews = [];
    } finally {
      this.isLoadingReviews = false;
    }
  }

  /**
   * Check if story should have image on left (alternating pattern)
   */
  isImageLeft(storyIndex: number): boolean {
    return storyIndex % 2 === 0;
  }

  /**
   * Check if there are multiple stories in a year
   */
  hasMultipleStoriesInYear(year: number): boolean {
    const stories = this.getStoriesForYear(year);
    return stories.length > 1;
  }

  /**
   * Handle image loading errors
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    // Try fallback to a generic placeholder or use a data URI
    img.src =
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjOTk5Ij5JbWFnZSBub3QgYXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==';
    img.onerror = null; // Prevent infinite loop
  }

  /**
   * Get numeric rating from star rating enum
   */
  getNumericRating(rating: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE'): number {
    return this.googleReviewsService.getNumericRating(rating);
  }

  /**
   * Format review date
   */
  formatReviewDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  /**
   * Get image URL from imagePath array
   */
  getImageUrl(story: ISuccessStory): string | null {
    if (story.imagePath && story.imagePath.length > 0 && story.imagePath[0].webUrl) {
      return story.imagePath[0].webUrl;
    }
    return null;
  }

  /**
   * Navigate to contact us page
   */
  bookAppointment(): void {
    this.router.navigate(['/contact-us']);
  }

  /**
   * Navigate to our programs page
   */
  learnMoreAboutPrograms(): void {
    this.router.navigate(['/our-programs']);
  }
}
