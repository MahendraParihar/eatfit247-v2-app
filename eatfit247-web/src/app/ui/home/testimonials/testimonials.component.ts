import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { GoogleReviewsService } from '../../../services/google-reviews.service';
import { IGoogleReview } from 'eatfit247-shared-library';

export interface Testimonial {
  id: string;
  name: string;
  review: string;
  date: string;
  imageUrl?: string;
  imageAlt?: string;
}

/**
 * Testimonials Component
 * Displays client testimonials in a slider format with auto-play
 */
@Component({
  selector: 'app-testimonials',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './testimonials.component.html',
  styleUrl: './testimonials.component.scss',
})
export class TestimonialsComponent implements OnInit, OnDestroy {
  private readonly googleReviewsService = inject(GoogleReviewsService);

  // Testimonials data loaded from Google Reviews
  readonly testimonials = signal<Testimonial[]>([]);
  readonly isLoading = signal(false);

  readonly currentIndex = signal(0);

  readonly currentTestimonial = computed(() => {
    const testimonials = this.testimonials();
    if (testimonials.length === 0) return null;
    return testimonials[this.currentIndex()];
  });

  readonly hasMultipleTestimonials = computed(() => this.testimonials().length > 1);

  // Show section only if testimonials exist and loading is complete
  readonly shouldShowSection = computed(() => {
    return !this.isLoading() && this.testimonials().length > 0;
  });

  ngOnInit(): void {
    this.loadGoogleReviews();
  }

  /**
   * Load Google reviews and convert to testimonials format
   */
  private async loadGoogleReviews(): Promise<void> {
    this.isLoading.set(true);
    try {
      const response = await this.googleReviewsService.loadReviews();
      const reviews = response.reviews || [];

      // Sort by createTime (newest first) and take latest 5
      const latestReviews = reviews
        .sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())
        .slice(0, 5)
        .map((review: IGoogleReview) => this.mapGoogleReviewToTestimonial(review));

      this.testimonials.set(latestReviews);

      // Autoplay disabled - manual navigation only
    } catch (error) {
      console.error('Failed to load Google reviews:', error);
      this.testimonials.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Map Google Review to Testimonial format
   */
  private mapGoogleReviewToTestimonial(review: IGoogleReview): Testimonial {
    return {
      id: review.reviewId,
      name: review.reviewer.displayName || 'Anonymous',
      review: review.comment || '',
      date: this.formatDate(review.createTime),
      imageUrl: review.reviewer.profilePhotoUrl,
      imageAlt: review.reviewer.displayName || 'Reviewer',
    };
  }

  /**
   * Format date from ISO string to readable format
   */
  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  ngOnDestroy(): void {
    // Autoplay disabled - no cleanup needed
  }

  /**
   * Go to next testimonial
   */
  next(): void {
    if (!this.hasMultipleTestimonials()) return;
    const testimonials = this.testimonials();
    const nextIndex = (this.currentIndex() + 1) % testimonials.length;
    this.goToTestimonial(nextIndex);
  }

  /**
   * Go to previous testimonial
   */
  previous(): void {
    if (!this.hasMultipleTestimonials()) return;
    const testimonials = this.testimonials();
    const prevIndex =
      this.currentIndex() === 0
        ? testimonials.length - 1
        : this.currentIndex() - 1;
    this.goToTestimonial(prevIndex);
  }

  /**
   * Go to specific testimonial
   */
  goToTestimonial(index: number): void {
    const testimonials = this.testimonials();
    if (index >= 0 && index < testimonials.length) {
      this.currentIndex.set(index);
    }
  }

  /**
   * Handle image loading errors
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    // Use a placeholder if image fails to load
    img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iI2U1ZTdlYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0iIzk5OSIgZm9udC1mYW1pbHk9IkFyaWFsIj5Vc2VyPC90ZXh0Pjwvc3ZnPg==';
    img.onerror = null; // Prevent infinite loop
  }
}

