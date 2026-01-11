import { Injectable, inject } from '@angular/core';
import { HttpService } from './http.service';
import { IFaq, IFaqCategory, IPublicTableList } from 'eatfit247-shared-library';

/**
 * Service to manage FAQ data
 * Fetches FAQs from the public API
 */
@Injectable({
  providedIn: 'root'
})
export class FaqService {
  private readonly httpService = inject(HttpService);

  /**
   * Get all FAQs
   */
  async getAllFaqs(): Promise<IFaq[]> {
    const result = await this.getPaginatedFaqs(0, 1000);
    return result.faqs;
  }

  /**
   * Get paginated FAQs
   */
  async getPaginatedFaqs(
    page: number,
    pageSize: number,
    categoryId?: number
  ): Promise<{
    faqs: IFaq[];
    total: number;
    totalPages: number;
  }> {
    try {
      const params: any = {
        page: page.toString(),
        limit: pageSize.toString()
      };
      if (categoryId) {
        params.faqCategoryId = categoryId.toString();
      }
      const data = await this.httpService.get<IPublicTableList<IFaq>>('public/faq/list', params);
      if (data) {
        const faqs = data.tableData as IFaq[];
        const total = data.count;
        const totalPages = Math.ceil(total / pageSize);
        return { faqs, total, totalPages };
      } else {
        return { faqs: [], total: 0, totalPages: 0 };
      }
    } catch (error) {
      return { faqs: [], total: 0, totalPages: 0 };
    }
  }

  /**
   * Get FAQs by category ID
   */
  async getFaqsByCategory(categoryId: number): Promise<IFaq[]> {
    try {
      const data = await this.httpService.get<IPublicTableList<IFaq>>('public/faq/list', {
        faqCategoryId: categoryId.toString(),
        limit: '1000'
      });
      if (data) {
        return data.tableData as IFaq[];
      }
      return [];
    } catch (error) {
      console.error('Error fetching FAQs by category:', error);
      return [];
    }
  }

  /**
   * Get FAQs by category URL
   * @param categoryUrl - The URL slug of the FAQ category (e.g., 'debloat-powder')
   * @returns Promise of FaqItem array
   */
  async getFaqsByCategoryUrl(categoryUrl: string): Promise<IFaq[]> {
    try {
      const data = await this.httpService.get<IPublicTableList<IFaq>>(
        `public/faq/by-category-url/${categoryUrl}`,
        {
          limit: '1000'
        }
      );
      if (data) {
        return data.tableData as IFaq[];
      }
      return [];
    } catch (error) {
      console.error(`Error fetching FAQs by category URL (${categoryUrl}):`, error);
      return [];
    }
  }

  /**
   * Get all categories from API
   */
  async getAllCategories(): Promise<IFaqCategory[]> {
    try {
      const categories = await this.httpService.get<IFaqCategory[]>('public/faq-category/list');
      if (categories && Array.isArray(categories)) {
        return categories.sort((a, b) => (a.faqCategory || '').localeCompare(b.faqCategory || ''));
      }
      return [];
    } catch (error) {
      console.error('Error fetching FAQ categories:', error);
      return [];
    }
  }
}

