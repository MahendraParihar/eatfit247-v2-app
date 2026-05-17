import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BaseListComponent, DataTableComponent, ITableColumn } from '@shared';
import { ICallType } from '@eatfit247-shared-lib';
import { CallTypeApiService } from '../api.service';

@Component({
  selector: 'lib-call-type',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './call-type.html',
  styleUrl: './call-type.scss',
})
export class CallType extends BaseListComponent<ICallType> {
  protected apiService = inject(CallTypeApiService);

  protected listConfig = {
    editRoute: '/lov-master/call-type/edit',
    createRoute: '/lov-master/call-type/new',
    searchPlaceholder: 'Search call type...',
    emptyMessage: 'No call type records found',
  };

  protected buildEntityColumns(): ITableColumn<ICallType>[] {
    return [
      { key: 'callTypeId', label: 'ID', dataKey: 'callTypeId', sortable: true, width: '80px' },
      { key: 'image', label: 'Image', dataKey: 'imagePath', type: 'image', isAvatar: true, imageAlt: 'Call Type Image', sortable: false, width: '80px', align: 'center' },
      { key: 'callType', label: 'Call Type', dataKey: 'callType', sortable: true, searchable: true },
    ];
  }

  protected getItemId(item: ICallType): number { return item.callTypeId; }
  protected getItemDisplayName(item: ICallType): string { return item.callType; }
}
