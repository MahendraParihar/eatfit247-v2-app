import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BaseListComponent, DataTableComponent, ITableColumn } from '@shared';
import { IFaqCategory } from '@eatfit247-shared-lib';
import { FaqCategoryApiService } from '../api.service';

@Component({
  selector: 'lib-faq-category',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './faq-category.html',
  styleUrl: './faq-category.scss',
})
export class FaqCategory extends BaseListComponent<IFaqCategory> {
  protected apiService = inject(FaqCategoryApiService);

  protected listConfig = {
    editRoute: '/lov-master/faq-category/edit',
    createRoute: '/lov-master/faq-category/new',
    searchPlaceholder: 'Search faq category...',
    emptyMessage: 'No faq category records found',
  };

  protected buildEntityColumns(): ITableColumn<IFaqCategory>[] {
    return [
      { key: 'faqCategoryId', label: 'ID', dataKey: 'faqCategoryId', sortable: true, width: '80px' },
      { key: 'faqCategory', label: 'FAQ Category', dataKey: 'faqCategory', sortable: true, searchable: true },
    ];
  }

  protected getItemId(item: IFaqCategory): number { return item.faqCategoryId; }
  protected getItemDisplayName(item: IFaqCategory): string { return item.faqCategory; }
}
