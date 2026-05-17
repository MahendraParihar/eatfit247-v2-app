import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BaseListComponent, DataTableComponent, ITableColumn } from '@shared';
import { IProduct } from '@eatfit247-shared-lib';
import { ProductsApiService } from './api.service';

@Component({
  selector: 'lib-products',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './products.html',
  styleUrl: './products.scss'
})
export class Products extends BaseListComponent<IProduct> {
  protected apiService = inject(ProductsApiService);

  protected listConfig = {
    editRoute: '/products/edit',
    createRoute: '/products/new',
    searchPlaceholder: 'Search products...',
    emptyMessage: 'No products found',
  };

  protected buildEntityColumns(): ITableColumn<IProduct>[] {
    return [
      { key: 'productId', label: 'ID', dataKey: 'productId', sortable: true, width: '80px' },
      {
        key: 'image', label: 'Image', isAvatar: true, dataKey: 'imagePath', sortable: false, type: 'image',
        formatter: (value) => {
          if (value && Array.isArray(value) && value.length > 0) {
            return value[0]?.url || value[0]?.path || '';
          }
          return '';
        },
      },
      { key: 'name', label: 'Name', dataKey: 'name', sortable: true, searchable: true },
      {
        key: 'priceRange', label: 'Price Range', dataKey: 'additionalInfo.priceRange', sortable: false,
        formatter: (value, row) => {
          const priceRange = row?.additionalInfo?.priceRange;
          if (priceRange && priceRange.min !== undefined && priceRange.max !== undefined) {
            return `₹${priceRange.min} - ₹${priceRange.max}`;
          }
          return '-';
        },
      },
    ];
  }

  protected getItemId(item: IProduct): number { return item.productId; }
  protected getItemDisplayName(item: IProduct): string { return item.name; }
}
