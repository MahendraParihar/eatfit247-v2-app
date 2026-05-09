import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BaseListComponent, DataTableComponent, ITableColumn } from '@shared';
import { ISeoPage } from '@eatfit247-shared-lib';
import { SeoPageApiService } from './api.service';

@Component({
  selector: 'lib-seo-page',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './seo-page.html',
  styleUrl: './seo-page.scss'
})
export class SeoPage extends BaseListComponent<ISeoPage> {
  protected apiService = inject(SeoPageApiService);

  protected listConfig = {
    editRoute: '/seo-page/edit',
    createRoute: '/seo-page/new',
    searchPlaceholder: 'Search SEO pages...',
    emptyMessage: 'No SEO pages found',
  };

  protected buildEntityColumns(): ITableColumn<ISeoPage>[] {
    return [
      { key: 'seoPageId', label: 'ID', dataKey: 'seoPageId', sortable: true, width: '80px' },
      { key: 'url', label: 'URL', dataKey: 'url', sortable: true, searchable: true },
      { key: 'metaTitle', label: 'Meta Title', dataKey: 'metaTitle', sortable: true, searchable: true },
    ];
  }

  protected getItemId(item: ISeoPage): number { return item.seoPageId; }
  protected getItemDisplayName(item: ISeoPage): string { return item.url; }
}
