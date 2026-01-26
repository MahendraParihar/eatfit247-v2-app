import { inject, Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { IPublicPressMedia, IPublicTableList } from 'eatfit247-shared-library';

@Injectable({
  providedIn: 'root'
})
export class PressMediaService {
  private readonly httpService = inject(HttpService);

  /**
   * Get all press/media articles
   */
  async getAllArticles(type?: 'press' | 'youtube'): Promise<IPublicPressMedia[]> {
    try {
      const params: Record<string, string> = { limit: '10' };
      if (type) {
        Object.assign(params, { type });
      }
      const data = await this.httpService.get<IPublicTableList<IPublicPressMedia>>(
        'public/press-media/list',
        params
      );
      if (data) {
        return data.tableData;
      }
      return [];
    } catch (error) {
      console.error('Error fetching press/media articles:', error);
      return [];
    }
  }
}
