import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { GoogleReviewsService } from '../../../services/google-reviews.service';
import { IGoogleReview } from 'eatfit247-shared-library';

/**
 * Google Reviews Component
 * Displays Google Business Profile reviews in a carousel format
 */
@Component({
  selector: 'app-google-reviews',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './google-reviews.component.html',
  styleUrl: './google-reviews.component.scss',
})
export class GoogleReviewsComponent implements OnInit {
  private readonly googleReviewsService = inject(GoogleReviewsService);
  reviews: IGoogleReview[] = [];
  readonly currentIndex = signal(0);
  isLoading = false;
  hasError = false;
  averageRating: number | undefined;
  totalReviewCount: number | undefined;
  readonly currentReview = computed(() => {
    if (this.reviews.length === 0) return null;
    return this.reviews[this.currentIndex()];
  });
  readonly hasMultipleReviews = computed(() => this.reviews.length > 1);

  ngOnInit(): void {
    this.loadReviews();
  }

  /**
   * Load reviews from Google Reviews service
   */
  private async loadReviews(): Promise<void> {
    this.isLoading = true;
    this.hasError = false;
    try {
      const response = await this.googleReviewsService.loadReviews();
      this.reviews = response.reviews || [];
      this.averageRating = response.averageRating;
      this.totalReviewCount = response.totalReviewCount;
      if (this.reviews.length === 0) {
        this.hasError = true;
      }
    } catch (error) {
      console.error('Failed to load Google reviews:', error);
      this.hasError = true;
      this.reviews = [];
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Go to next review
   */
  next(): void {
    if (!this.hasMultipleReviews()) return;
    const nextIndex = (this.currentIndex() + 1) % this.reviews.length;
    this.currentIndex.set(nextIndex);
  }

  /**
   * Go to previous review
   */
  previous(): void {
    if (!this.hasMultipleReviews()) return;
    const prevIndex = this.currentIndex() === 0 ? this.reviews.length - 1 : this.currentIndex() - 1;
    this.currentIndex.set(prevIndex);
  }

  /**
   * Go to specific review
   */
  goToReview(index: number): void {
    if (index >= 0 && index < this.reviews.length) {
      this.currentIndex.set(index);
    }
  }

  /**
   * Get numeric rating from enum
   */
  getNumericRating(rating: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE'): number {
    return this.googleReviewsService.getNumericRating(rating);
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  }

  /**
   * Get star rating display
   */
  getStarRating(rating: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE'): string {
    const numRating = this.getNumericRating(rating);
    return '★'.repeat(numRating) + '☆'.repeat(5 - numRating);
  }

  /**
   * Math object for template access
   */
  Math = Math;

  /**
   * Get profile image URL with fallback
   */
  getProfileImageUrl(review: IGoogleReview): string {
    if (review.reviewer.profilePhotoUrl) {
      return review.reviewer.profilePhotoUrl;
    }
    // Return placeholder image
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSIzMiIgZmlsbD0iI0Y1RjVGNSIvPjxwYXRoIGQ9Ik0zMiAyMEMzNy41MjI4IDIwIDQyIDE2LjQxNDIgNDIgMTJDNDIgNy41ODU3OSAzNy41MjI4IDQgMzIgNEMyNi40NzcyIDQgMjIgNy41ODU3OSAyMiAxMkMyMiAxNi40MTQyIDI2LjQ3NzIgMjAgMzIgMjBaIiBmaWxsPSIjOTk5Ii8+PHBhdGggZD0iTTMyIDIyQzI1LjM3MjYgMjIgMjAgMjcuMzcyNiAyMCAzNFY0MEg0NFYzNEM0NCAyNy4zNzI2IDM4LjYyNzQgMjIgMzIgMjJaIiBmaWxsPSIjOTk5Ii8+PC9zdmc+';
  }

  /**
   * Handle image loading errors
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src =
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSIzMiIgZmlsbD0iI0Y1RjVGNSIvPjxwYXRoIGQ9Ik0zMiAyMEMzNy41MjI4IDIwIDQyIDE2LjQxNDIgNDIgMTJDNDIgNy41ODU3OSAzNy41MjI4IDQgMzIgNEMyNi40NzcyIDQgMjIgNy41ODU3OSAyMiAxMkMyMiAxNi40MTQyIDI2LjQ3NzIgMjAgMzIgMjBaIiBmaWxsPSIjOTk5Ii8+PHBhdGggZD0iTTMyIDIyQzI1LjM3MjYgMjIgMjAgMjcuMzcyNiAyMCAzNFY0MEg0NFYzNEM0NCAyNy4zNzI2IDM4LjYyNzQgMjIgMzIgMjJaIiBmaWxsPSIjOTk5Ii8+PC9zdmc+';
    img.onerror = null;
  }
}

