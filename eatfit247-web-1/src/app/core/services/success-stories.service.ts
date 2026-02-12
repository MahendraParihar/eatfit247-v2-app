import { inject, Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { IPublicTableList, ISuccessStory } from '@eatfit247-shared-library/core';

@Injectable({
  providedIn: 'root'
})
export class SuccessStoriesService {
  private readonly httpService = inject(HttpService);

  async loadStories(): Promise<ISuccessStory[]> {
    try {
      const data = await this.httpService.get<IPublicTableList<ISuccessStory>>(
        'success-story/list',
        {
          params: {
            active: true,
            limit: 1000
          }
        }
      );
      if (data) {
        return data.data.tableData as ISuccessStory[];
      }
      return [];
    } catch (error) {
      return [];
    }
  }
}


