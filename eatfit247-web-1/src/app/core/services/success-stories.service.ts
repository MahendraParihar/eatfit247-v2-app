import { inject, Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { IPublicTableList, ISuccessStory } from '@eatfit247-shared-library/core';

interface LoadStoriesOptions {
  showOnWebsite?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SuccessStoriesService {
  private readonly httpService = inject(HttpService);

  async loadStories(options: LoadStoriesOptions = {}): Promise<ISuccessStory[]> {
    try {
      const params: Record<string, string | number | boolean> = {
        active: true,
        limit: 1000,
      };
      if (options.showOnWebsite !== undefined) {
        params['showOnWebsite'] = options.showOnWebsite;
      }
      const data = await this.httpService.get<IPublicTableList<ISuccessStory>>(
        'success-story/list',
        { params }
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
