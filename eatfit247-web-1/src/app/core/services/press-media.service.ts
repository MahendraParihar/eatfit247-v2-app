import { inject, Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { IPublicPressMedia, IPublicTableList } from '@eatfit247-shared-library/core';
import { buildMediaUrl } from '../utils/media-url.util';
import { ICardData } from '@shared-ui';

@Injectable({
  providedIn: 'root'
})
export class PressMediaService {
  private readonly httpService = inject(HttpService);

  /**
   * Get all press/media articles
   * Mirrors legacy eatfit247-web PressMediaService
   */
  async getAllArticles(type?: 'press' | 'youtube', limit = 10): Promise<ICardData[]> {
    try {
      const params: Record<string, string> = { limit: String(limit) };
      if (type) {
        Object.assign(params, { type });
      }
      const data = await this.httpService.get<
        IPublicTableList<IPublicPressMedia>
      >('press-media/list', {
        params
      });
      if (data.data) {
        return this.mapPressesToCards(data.data.tableData);
      }
      return [];
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching press/media articles:', error);
      return [];
    }
  }

  mapPressesToCards(blogs: IPublicPressMedia[]): ICardData[] {
    return blogs.map((blog) => this.mapPressToCard(blog));
  }

  private mapPressToCard(pressMedia: IPublicPressMedia): ICardData {
    const firstImage =
      pressMedia.imagePath && pressMedia.imagePath.length > 0
        ? pressMedia.imagePath[0]
        : null;
    const imageUrl = buildMediaUrl(firstImage?.webUrl);
    return {
      id: pressMedia.pressMediaId,
      title: pressMedia.title,
      summary: null,
      linkUrl: pressMedia.link,
      imageUrl,
      imageAlt: pressMedia.title,
      category: undefined,
      date: pressMedia.publishDate,
      readTime: undefined,
      isExternalLink: true
    };
  }
}


