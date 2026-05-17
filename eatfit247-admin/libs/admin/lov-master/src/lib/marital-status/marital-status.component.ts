import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BaseListComponent, DataTableComponent, ITableColumn } from '@shared';
import { IMaritalStatus } from '@eatfit247-shared-lib';
import { MaritalStatusApiService } from '../api.service';

@Component({
  selector: 'lib-marital-status',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './marital-status.html',
  styleUrl: './marital-status.scss',
})
export class MaritalStatus extends BaseListComponent<IMaritalStatus> {
  protected apiService = inject(MaritalStatusApiService);

  protected listConfig = {
    editRoute: '/lov-master/marital-status/edit',
    createRoute: '/lov-master/marital-status/new',
    searchPlaceholder: 'Search marital status...',
    emptyMessage: 'No marital status records found',
  };

  protected buildEntityColumns(): ITableColumn<IMaritalStatus>[] {
    return [
      { key: 'maritalStatusId', label: 'ID', dataKey: 'maritalStatusId', sortable: true, width: '80px' },
      { key: 'maritalStatus', label: 'Marital Status', dataKey: 'maritalStatus', sortable: true, searchable: true },
      { key: 'image', label: 'Image', dataKey: 'imagePath', type: 'image', isAvatar: true, imageAlt: 'Marital Status Image', sortable: false, width: '80px', align: 'center' },
    ];
  }

  protected getItemId(item: IMaritalStatus): number { return item.maritalStatusId; }
  protected getItemDisplayName(item: IMaritalStatus): string { return item.maritalStatus; }
}
