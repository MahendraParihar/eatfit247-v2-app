import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BaseListComponent, DataTableComponent, ITableColumn } from '@shared';
import { ICallPurpose } from '@eatfit247-shared-lib';
import { CallPurposeApiService } from '../api.service';

@Component({
  selector: 'lib-call-purpose',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './call-purpose.html',
  styleUrl: './call-purpose.scss',
})
export class CallPurpose extends BaseListComponent<ICallPurpose> {
  protected apiService = inject(CallPurposeApiService);

  protected listConfig = {
    editRoute: '/lov-master/call-purpose/edit',
    createRoute: '/lov-master/call-purpose/new',
    searchPlaceholder: 'Search call purpose...',
    emptyMessage: 'No call purpose records found',
  };

  protected buildEntityColumns(): ITableColumn<ICallPurpose>[] {
    return [
      { key: 'callPurposeId', label: 'ID', dataKey: 'callPurposeId', sortable: true, width: '80px' },
      { key: 'callPurpose', label: 'Call Purpose', dataKey: 'callPurpose', sortable: true, searchable: true },
      { key: 'image', label: 'Image', dataKey: 'imagePath', type: 'image', isAvatar: true, imageAlt: 'Call Purpose Image', sortable: false, width: '80px', align: 'center' },
    ];
  }

  protected getItemId(item: ICallPurpose): number { return item.callPurposeId; }
  protected getItemDisplayName(item: ICallPurpose): string { return item.callPurpose; }
}
