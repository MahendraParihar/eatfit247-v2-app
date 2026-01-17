import { Injectable, inject } from '@angular/core';
import { HttpService } from './http.service';
import { IPublicProduct, IPublicTableList } from 'eatfit247-shared-library';

/**
 * Service to manage product data
 * Fetches product data from the public API
 */
@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly httpService = inject(HttpService);

  /**
   * Get all products
   * @param page - Page number (0-indexed)
   * @param limit - Number of items per page
   * @returns Promise of a products list
   */
  async getAllProducts(page: number = 0, limit: number = 50): Promise<IPublicProduct[]> {
    try {
      const data = await this.httpService.get<IPublicTableList<IPublicProduct>>(
        'public/products/list',
        {
          page: page.toString(),
          limit: limit.toString(),
        }
      );

      if (data) {
        return data.tableData || [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }
}

