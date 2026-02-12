import { inject, Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { IPublicLegalPage } from '@eatfit247-shared-library/core';

/**
 * Service to load public legal pages (Terms, Privacy Policy, etc.)
 * from the public API using their URL slug.
 */
@Injectable({
  providedIn: 'root'
})
export class LegalPagesService {
  private readonly httpService = inject(HttpService);

  /**
   * Load a legal page by its URL slug.
   *
   * Backend route:
   *   GET /api/v2/legal-page/url/:url
   *
   * @param url URL slug for the legal page (e.g. "terms-and-conditions")
   */
  async getByUrl(url: string): Promise<IPublicLegalPage | null> {
    try {
      const encodedUrl = encodeURIComponent(url.trim());
      if (!encodedUrl) {
        return null;
      }
      const res = await this.httpService.get<IPublicLegalPage>(
        `legal-page/url/${encodedUrl}`
      );
      return res.data || null;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error fetching legal page for url "${url}":`, error);
      return null;
    }
  }
}


