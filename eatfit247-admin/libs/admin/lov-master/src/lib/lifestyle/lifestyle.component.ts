import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BaseListComponent, DataTableComponent, ITableColumn } from '@shared';
import { ILifestyle } from '@eatfit247-shared-lib';
import { LifestyleApiService } from '../api.service';

@Component({
  selector: 'lib-lifestyle',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './lifestyle.html',
  styleUrl: './lifestyle.scss',
})
export class Lifestyle extends BaseListComponent<ILifestyle> {
  protected apiService = inject(LifestyleApiService);

  protected listConfig = {
    editRoute: '/lov-master/lifestyle/edit',
    createRoute: '/lov-master/lifestyle/new',
    searchPlaceholder: 'Search lifestyle...',
    emptyMessage: 'No lifestyle records found',
  };

  protected buildEntityColumns(): ITableColumn<ILifestyle>[] {
    return [
      { key: 'lifestyleId', label: 'ID', dataKey: 'lifestyleId', sortable: true, width: '80px' },
      { key: 'lifestyle', label: 'Lifestyle', dataKey: 'lifestyle', sortable: true, searchable: true },
      { key: 'image', label: 'Image', dataKey: 'imagePath', type: 'image', isAvatar: true, imageAlt: 'Lifestyle Image', sortable: false, width: '80px', align: 'center' },
    ];
  }

  protected getItemId(item: ILifestyle): number { return item.lifestyleId; }
  protected getItemDisplayName(item: ILifestyle): string { return item.lifestyle; }
}
