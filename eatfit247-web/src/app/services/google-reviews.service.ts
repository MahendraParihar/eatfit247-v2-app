import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface GoogleReview {
  author_name: string;
  author_url?: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
}

export interface GooglePlaceDetails {
  place_id: string;
  name: string;
  rating: number;
  user_ratings_total: number;
  reviews: GoogleReview[];
}

@Injectable({
  providedIn: 'root',
})
export class GoogleReviewsService {
  private readonly http = inject(HttpClient);

  // Google Places API configuration
  // Note: In production, use a backend proxy to keep API key secure
  private readonly API_KEY = 'YOUR_GOOGLE_PLACES_API_KEY'; // Replace with your API key
  private readonly PLACE_ID = 'YOUR_PLACE_ID'; // Replace with your Google Place ID
  private readonly API_URL = 'https://maps.googleapis.com/maps/api/place/details/json';

  /**
   * Fetch Google reviews for a place
   * @param placeId Optional place ID, defaults to configured PLACE_ID
   * @returns Observable of reviews array
   */
  getReviews(placeId?: string): Observable<GoogleReview[]> {
    const id = placeId || this.PLACE_ID;
    
    // If using backend proxy (recommended for production)
    // return this.http.get<{ reviews: GoogleReview[] }>('/api/google-reviews').pipe(
    //   map(response => response.reviews),
    //   catchError(() => this.getFallbackReviews())
    // );

    // Direct API call (requires CORS and API key exposure)
    const url = `${this.API_URL}?place_id=${id}&fields=reviews&key=${this.API_KEY}`;
    
    return this.http.get<{ result: GooglePlaceDetails }>(url).pipe(
      map((response) => response.result?.reviews || []),
      catchError(() => {
        console.warn('Failed to fetch Google reviews, using fallback data');
        return this.getFallbackReviews();
      })
    );
  }

  /**
   * Get reviews with limit
   * @param limit Maximum number of reviews to return
   * @param placeId Optional place ID
   */
  getReviewsLimited(limit: number = 5, placeId?: string): Observable<GoogleReview[]> {
    return this.getReviews(placeId).pipe(
      map((reviews) => reviews.slice(0, limit))
    );
  }

  /**
   * Fallback reviews if API fails
   */
  private getFallbackReviews(): Observable<GoogleReview[]> {
    return of([
      {
        author_name: 'Aditi Sharma',
        rating: 5,
        relative_time_description: '2 weeks ago',
        text: 'The team responds super fast and truly understands your health goals.',
        time: Date.now(),
      },
      {
        author_name: 'Rahul Verma',
        rating: 5,
        relative_time_description: '1 month ago',
        text: 'Their guidance changed my lifestyle completely. Amazing support!',
        time: Date.now(),
      },
      {
        author_name: 'Priya Patel',
        rating: 5,
        relative_time_description: '3 weeks ago',
        text: 'Excellent nutrition advice and personalized plans. Highly recommended!',
        time: Date.now(),
      },
    ]);
  }

  /**
   * Get place details including rating and total reviews
   */
  getPlaceDetails(placeId?: string): Observable<{ rating: number; totalReviews: number }> {
    const id = placeId || this.PLACE_ID;
    const url = `${this.API_URL}?place_id=${id}&fields=rating,user_ratings_total&key=${this.API_KEY}`;
    
    return this.http.get<{ result: { rating: number; user_ratings_total: number } }>(url).pipe(
      map((response) => ({
        rating: response.result?.rating || 0,
        totalReviews: response.result?.user_ratings_total || 0,
      })),
      catchError(() => of({ rating: 5, totalReviews: 2000 }))
    );
  }
}

