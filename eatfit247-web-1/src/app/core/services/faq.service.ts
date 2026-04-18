import { inject, Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { IPublicFaq, IPublicTableList } from '@eatfit247-shared-library/core';

@Injectable({
  providedIn: 'root',
})
export class FaqService {
  private readonly httpService = inject(HttpService);

  async getFaqsByCategoryId(
    faqCategoryId: number,
    page: number = 0,
    limit: number = 50,
  ): Promise<IPublicFaq[]> {
    try {
      const data = await this.httpService.get<IPublicTableList<IPublicFaq>>(
        'faq/list',
        {
          params: {
            page: page.toString(),
            limit: limit.toString(),
            faqCategoryId: faqCategoryId.toString(),
          },
        },
      );
      if (data) {
        return data.data.tableData || [];
      }
      return [];
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching FAQs:', error);
      return [];
    }
  }
}
