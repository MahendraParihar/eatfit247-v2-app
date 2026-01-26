import { inject, Injectable } from '@angular/core';
import { IGoogleReviewsResponse } from 'eatfit247-shared-library';
import { HttpService } from './http.service';

/**
 * Service to fetch Google Business Profile reviews
 * Note: This calls the Public API (api/v2/public) via proxy
 */
@Injectable({
  providedIn: 'root'
})
export class GoogleReviewsService {
  private readonly httpService = inject(HttpService);
  private readonly endpoint = 'public/success-story/google-reviews';

  /**
   * Load Google reviews from API
   */
  async loadReviews(): Promise<IGoogleReviewsResponse> {
    try {
      const response = await this.httpService.get<IGoogleReviewsResponse>(this.endpoint);
      if (!response) {
        return { reviews: [] } as IGoogleReviewsResponse;
      }
      return response;
    } catch (error) {
      console.error('Failed to load Google reviews from API:', error);
      return { reviews: [] };
    }
  }

  /**
   * Get numeric rating from enum
   */
  getNumericRating(rating: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE'): number {
    switch (rating) {
      case 'ONE':
        return 1;
      case 'TWO':
        return 2;
      case 'THREE':
        return 3;
      case 'FOUR':
        return 4;
      case 'FIVE':
        return 5;
      default:
        return 5;
    }
  }
}

