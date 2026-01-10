import { Injectable, inject } from '@angular/core';
import { HttpService } from './http.service';
import { IFaq, IFaqCategory, IPublicTableList } from 'eatfit247-shared-library';

export interface FaqItem {
  id: number;
  question: string;
  answer: string;
  categoryId: number;
  category: string;
}

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
  async getAllFaqs(): Promise<FaqItem[]> {
    const result = await this.getPaginatedFaqs(0, 1000);
    return result.faqs;
  }

  /**
   * Get paginated FAQs
   */
  async getPaginatedFaqs(page: number, pageSize: number, categoryId?: number): Promise<{
    faqs: FaqItem[];
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
      const data = await this.httpService.get<IPublicTableList<IFaq>>(
        'public/faq/list',
        params
      );
      if (data) {
        const faqs = data.tableData.map((faq: IFaq) => this.mapFaqToItem(faq));
        const total = data.count;
        const totalPages = Math.ceil(total / pageSize);
        return { faqs, total, totalPages };
      } else {
        return { faqs: [], total: 0, totalPages: 0 };
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      return { faqs: [], total: 0, totalPages: 0 };
    }
  }

  /**
   * Get FAQs by category ID
   */
  async getFaqsByCategory(categoryId: number): Promise<FaqItem[]> {
    try {
      const data = await this.httpService.get<IPublicTableList<IFaq>>(
        'public/faq/list',
        {
          faqCategoryId: categoryId.toString(),
          limit: '1000'
        }
      );
      if (data) {
        return data.tableData.map((faq: IFaq) => this.mapFaqToItem(faq));
      }
      return [];
    } catch (error) {
      console.error('Error fetching FAQs by category:', error);
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

  /**
   * Map IFaq from API to FaqItem
   */
  private mapFaqToItem(faq: IFaq): FaqItem {
    return {
      id: faq.faqId,
      question: faq.faq,
      answer: faq.answer,
      categoryId: faq.faqCategoryId,
      category: faq.faqCategory || 'Uncategorized'
    };
  }
}

