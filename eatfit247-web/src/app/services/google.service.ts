import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// Google Reviews Interfaces
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

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

/**
 * Unified Google Service
 * 
 * This service handles all Google-related integrations:
 * - Google Reviews (Places API)
 * - Google reCAPTCHA v3
 * 
 * Consolidates GoogleReviewsService and RecaptchaService into a single service.
 */
@Injectable({
  providedIn: 'root',
})
export class GoogleService {
  private readonly http = inject(HttpClient);
  private readonly recaptchaSiteKey = environment.recaptcha?.siteKey;
  private recaptchaScriptLoaded = false;
  private recaptchaScriptLoading = false;

  // Google Places API configuration
  // Note: In production, use a backend proxy to keep API key secure
  private readonly placesApiKey = 'YOUR_GOOGLE_PLACES_API_KEY'; // Replace with your API key
  private readonly placeId = 'YOUR_PLACE_ID'; // Replace with your Google Place ID
  private readonly placesApiUrl = 'https://maps.googleapis.com/maps/api/place/details/json';

  // ============================================================================
  // Google Reviews Methods
  // ============================================================================

  /**
   * Fetch Google reviews for a place
   * @param placeId Optional place ID, defaults to configured PLACE_ID
   * @returns Observable of reviews array
   */
  getReviews(placeId?: string): Observable<GoogleReview[]> {
    const id = placeId || this.placeId;
    
    // If using backend proxy (recommended for production)
    // return this.http.get<{ reviews: GoogleReview[] }>('/api/google-reviews').pipe(
    //   map(response => response.reviews),
    //   catchError(() => this.getFallbackReviews())
    // );

    // Direct API call (requires CORS and API key exposure)
    const url = `${this.placesApiUrl}?place_id=${id}&fields=reviews&key=${this.placesApiKey}`;
    
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
   * Get place details including rating and total reviews
   */
  getPlaceDetails(placeId?: string): Observable<{ rating: number; totalReviews: number }> {
    const id = placeId || this.placeId;
    const url = `${this.placesApiUrl}?place_id=${id}&fields=rating,user_ratings_total&key=${this.placesApiKey}`;
    
    return this.http.get<{ result: { rating: number; user_ratings_total: number } }>(url).pipe(
      map((response) => ({
        rating: response.result?.rating || 0,
        totalReviews: response.result?.user_ratings_total || 0,
      })),
      catchError(() => of({ rating: 5, totalReviews: 2000 }))
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

  // ============================================================================
  // Google reCAPTCHA v3 Methods
  // ============================================================================

  /**
   * Load the reCAPTCHA script dynamically
   */
  private loadRecaptchaScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.recaptchaScriptLoaded) {
        resolve();
        return;
      }

      if (this.recaptchaScriptLoading) {
        // Wait for existing load to complete
        const checkInterval = setInterval(() => {
          if (this.recaptchaScriptLoaded) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
        return;
      }

      this.recaptchaScriptLoading = true;

      // Check if script already exists
      if (document.querySelector('script[src*="recaptcha"]')) {
        this.recaptchaScriptLoading = false;
        this.recaptchaScriptLoaded = true;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${this.recaptchaSiteKey}`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        this.recaptchaScriptLoaded = true;
        this.recaptchaScriptLoading = false;
        resolve();
      };

      script.onerror = () => {
        this.recaptchaScriptLoading = false;
        reject(new Error('Failed to load reCAPTCHA script'));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Execute reCAPTCHA v3 and get a token
   * @param action - The action name (e.g., 'submit', 'login', 'contact')
   * @returns Promise that resolves to the reCAPTCHA token
   */
  async executeRecaptcha(action: string = 'submit'): Promise<string> {
    if (!this.recaptchaSiteKey || this.recaptchaSiteKey === 'YOUR_RECAPTCHA_V3_SITE_KEY') {
      console.warn('reCAPTCHA site key not configured');
      return '';
    }

    try {
      // Ensure script is loaded
      await this.loadRecaptchaScript();

      // Wait for grecaptcha to be ready
      return new Promise((resolve, reject) => {
        window.grecaptcha.ready(() => {
          window.grecaptcha
            .execute(this.recaptchaSiteKey, { action })
            .then((token: string) => {
              resolve(token);
            })
            .catch((error: any) => {
              console.error('reCAPTCHA execution failed:', error);
              reject(error);
            });
        });
      });
    } catch (error) {
      console.error('reCAPTCHA service error:', error);
      throw error;
    }
  }

  /**
   * Check if reCAPTCHA is available
   */
  isRecaptchaAvailable(): boolean {
    return (
      this.recaptchaScriptLoaded &&
      typeof window !== 'undefined' &&
      typeof window.grecaptcha !== 'undefined'
    );
  }
}

