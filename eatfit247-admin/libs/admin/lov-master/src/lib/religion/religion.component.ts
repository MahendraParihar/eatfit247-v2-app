import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BaseListComponent, DataTableComponent, ITableColumn } from '@shared';
import { IReligion } from '@eatfit247-shared-lib';
import { ReligionApiService } from '../api.service';

@Component({
  selector: 'lib-religion',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './religion.html',
  styleUrl: './religion.scss',
})
export class Religion extends BaseListComponent<IReligion> {
  protected apiService = inject(ReligionApiService);

  protected listConfig = {
    editRoute: '/lov-master/religion/edit',
    createRoute: '/lov-master/religion/new',
    searchPlaceholder: 'Search religion...',
    emptyMessage: 'No religion records found',
  };

  protected buildEntityColumns(): ITableColumn<IReligion>[] {
    return [
      { key: 'religionId', label: 'ID', dataKey: 'religionId', sortable: true, width: '80px' },
      { key: 'religion', label: 'Religion', dataKey: 'religion', sortable: true, searchable: true },
      { key: 'image', label: 'Image', dataKey: 'imagePath', type: 'image', isAvatar: true, imageAlt: 'Religion Image', sortable: false, width: '80px', align: 'center' },
    ];
  }

  protected getItemId(item: IReligion): number { return item.religionId; }
  protected getItemDisplayName(item: IReligion): string { return item.religion; }
}
