import { inject, Injectable } from '@angular/core';
import { ISeoPageData } from 'eatfit247-shared-library';
import { HttpService } from './http.service';

/**
 * SEO Page Service
 * Fetches SEO data from the public API
 */
@Injectable({
  providedIn: 'root',
})
export class SeoPageService {
  private readonly httpService = inject(HttpService);

  /**
   * Get SEO data by URL
   * @param url - The URL path (e.g., '/about-us', '/blog')
   * @returns Promise with SEO data or null if not found
   */
  async getSeoByUrl(url: string): Promise<ISeoPageData | null> {
    try {
      // Normalize URL: remove leading/trailing slashes and ensure it starts with /
      const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
      // Encode the URL for the API call
      const encodedUrl = encodeURIComponent(normalizedUrl);
      
      const seoData = await this.httpService.get<ISeoPageData>(
        `public/seo-page/url/${encodedUrl}`
      );
      
      return seoData;
    } catch (error) {
      console.error('Error fetching SEO data:', error);
      return null;
    }
  }

  /**
   * Get all SEO pages
   * @returns Promise with array of SEO pages
   */
  async getAllSeoPages(): Promise<ISeoPageData[]> {
    try {
      const seoPages = await this.httpService.get<ISeoPageData[]>(
        'public/seo-page/all'
      );
      
      return seoPages || [];
    } catch (error) {
      console.error('Error fetching all SEO pages:', error);
      return [];
    }
  }
}

