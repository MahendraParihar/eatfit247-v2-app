import { inject, Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { IPublicReferrer, IPublicTableList } from '@eatfit247-shared-library/core';

/**
 * Service to manage referrer/partner data
 * Fetches referrer data from the public API
 */
@Injectable({
  providedIn: 'root'
})
export class ReferrerService {
  private readonly httpService = inject(HttpService);

  /**
   * Get all active referrers (partners)
   */
  async getPartners(): Promise<IPublicReferrer[]> {
    try {
      const data = await this.httpService.get<
        IPublicTableList<IPublicReferrer>
      >('referrer/list', {
        params: {
          limit: '1000'
        }
      });
      return data.data.tableData;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching referrers/partners:', error);
      return [];
    }
  }
}


