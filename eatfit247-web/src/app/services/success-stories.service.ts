import { inject, Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { ISuccessStory, ITableList } from 'eatfit247-shared-library';

/**
 * Service to manage success stories
 */
@Injectable({
  providedIn: 'root'
})
export class SuccessStoriesService {
  private readonly httpService = inject(HttpService);
  private readonly endpoint = 'public/success-story/list';

  /**
   * Load all success stories from API
   */
  async loadStories(): Promise<ISuccessStory[]> {
    try {
      const response = await this.httpService.get<ITableList<ISuccessStory>>(
        this.endpoint,
        { active: true, limit: 1000 } // Get all active stories
      );
      // Map API response to frontend interface
      if (response?.tableData && response.tableData.length > 0) {
        console.log(response.tableData);
        return response.tableData as ISuccessStory[];
      }
      return [];
    } catch (error) {
      console.error('Failed to load success stories from API:', error);
      return [];
    }
  }
}

