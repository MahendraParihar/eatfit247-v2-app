import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BaseListComponent, DataTableComponent, ITableColumn } from '@shared';
import { ICallLogStatus } from '@eatfit247-shared-lib';
import { CallLogStatusApiService } from '../api.service';

@Component({
  selector: 'lib-call-log-status',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './call-log-status.html',
  styleUrl: './call-log-status.scss',
})
export class CallLogStatus extends BaseListComponent<ICallLogStatus> {
  protected apiService = inject(CallLogStatusApiService);

  protected listConfig = {
    editRoute: '/lov-master/call-log-status/edit',
    createRoute: '/lov-master/call-log-status/new',
    searchPlaceholder: 'Search call log status...',
    emptyMessage: 'No call log status records found',
  };

  protected buildEntityColumns(): ITableColumn<ICallLogStatus>[] {
    return [
      { key: 'callLogStatusId', label: 'ID', dataKey: 'callLogStatusId', sortable: true, width: '80px' },
      { key: 'callLogStatus', label: 'Call Log Status', dataKey: 'callLogStatus', sortable: true, searchable: true },
      { key: 'image', label: 'Image', dataKey: 'imagePath', type: 'image', isAvatar: true, imageAlt: 'Call Log Status Image', sortable: false, width: '80px', align: 'center' },
    ];
  }

  protected getItemId(item: ICallLogStatus): number { return item.callLogStatusId; }
  protected getItemDisplayName(item: ICallLogStatus): string { return item.callLogStatus; }
}
