import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BaseListComponent, DataTableComponent, ITableColumn } from '@shared';
import { IGender } from '@eatfit247-shared-lib';
import { GenderApiService } from '../api.service';

@Component({
  selector: 'lib-gender',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './gender.html',
  styleUrl: './gender.scss',
})
export class Gender extends BaseListComponent<IGender> {
  protected apiService = inject(GenderApiService);

  protected listConfig = {
    editRoute: '/lov-master/gender/edit',
    createRoute: '/lov-master/gender/new',
    searchPlaceholder: 'Search gender...',
    emptyMessage: 'No gender records found',
  };

  protected buildEntityColumns(): ITableColumn<IGender>[] {
    return [
      { key: 'genderId', label: 'ID', dataKey: 'genderId', sortable: true, width: '80px' },
      { key: 'gender', label: 'Gender', dataKey: 'gender', sortable: true, searchable: true },
      { key: 'image', label: 'Image', dataKey: 'imagePath', type: 'image', isAvatar: true, imageAlt: 'Gender Image', sortable: false, width: '80px', align: 'center' },
    ];
  }

  protected getItemId(item: IGender): number { return item.genderId; }
  protected getItemDisplayName(item: IGender): string { return item.gender; }
}
