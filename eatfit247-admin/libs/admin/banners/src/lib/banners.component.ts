import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BaseListComponent, DataTableComponent, ITableColumn } from '@shared';
import { BannerForEnum, IBanner } from '@eatfit247-shared-lib';
import { BannersApiService } from './api.service';

@Component({
  selector: 'lib-banners',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './banners.html',
  styleUrl: './banners.scss',
})
export class Banners extends BaseListComponent<IBanner> {
  protected apiService = inject(BannersApiService);

  protected listConfig = {
    editRoute: '/banners/edit',
    createRoute: '/banners/new',
    searchPlaceholder: 'Search banners...',
    emptyMessage: 'No banners found',
  };

  protected buildEntityColumns(): ITableColumn<IBanner>[] {
    return [
      { key: 'bannerId', label: 'ID', dataKey: 'bannerId', sortable: true, width: '80px' },
      { key: 'title', label: 'Title', dataKey: 'title', sortable: true, searchable: true },
      { key: 'subTitle', label: 'Sub Title', dataKey: 'subTitle', sortable: true },
      {
        key: 'bannerFor', label: 'Banner For', dataKey: 'bannerFor', sortable: true,
        formatter: (value) => {
          const enumValue = value as BannerForEnum;
          return enumValue ? enumValue.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : '';
        },
      },
    ];
  }

  protected getItemId(item: IBanner): number { return item.bannerId; }
  protected getItemDisplayName(item: IBanner): string { return item.title; }
}
