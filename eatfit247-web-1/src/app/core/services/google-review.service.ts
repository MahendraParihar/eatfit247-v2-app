import { inject, Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { IPublicTableList } from '@eatfit247-shared-library/core';
import {
  GoogleReviewEntityTypeEnum,
  IPublicGoogleReview,
} from '@eatfit247-shared-library';

@Injectable({
  providedIn: 'root',
})
export class GoogleReviewService {
  private readonly httpService = inject(HttpService);

  async getReviewsByEntity(
    entityType: GoogleReviewEntityTypeEnum,
    entityId: number,
    page: number = 0,
    limit: number = 50,
  ): Promise<IPublicGoogleReview[]> {
    try {
      const data = await this.httpService.get<IPublicTableList<IPublicGoogleReview>>(
        'google-review/by-entity',
        {
          params: {
            entityType,
            entityId: entityId.toString(),
            page: page.toString(),
            limit: limit.toString(),
          },
        },
      );
      if (data) {
        return data.data.tableData || [];
      }
      return [];
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching Google reviews:', error);
      return [];
    }
  }
}
