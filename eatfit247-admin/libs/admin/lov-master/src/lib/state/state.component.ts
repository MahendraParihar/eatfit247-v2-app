import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BaseListComponent, DataTableComponent, ITableColumn } from '@shared';
import { IState } from '@eatfit247-shared-lib';
import { StateApiService } from '../api.service';

@Component({
  selector: 'lib-state',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './state.html',
  styleUrl: './state.scss',
})
export class State extends BaseListComponent<IState> {
  protected apiService = inject(StateApiService);

  protected listConfig = {
    editRoute: '/lov-master/state/edit',
    createRoute: '/lov-master/state/new',
    searchPlaceholder: 'Search state...',
    emptyMessage: 'No state records found',
  };

  protected buildEntityColumns(): ITableColumn<IState>[] {
    return [
      { key: 'stateId', label: 'ID', dataKey: 'stateId', sortable: true, width: '80px' },
      { key: 'state', label: 'State', dataKey: 'state', sortable: true, searchable: true },
      { key: 'country', label: 'Country', dataKey: 'country', sortable: false, type: 'text' },
      { key: 'taxPercentage', label: 'Tax %', dataKey: 'taxPercentage', sortable: true, width: '100px', formatter: (value) => value ? `${value}%` : '0%' },
    ];
  }

  protected getItemId(item: IState): number { return item.stateId; }
  protected getItemDisplayName(item: IState): string { return item.state; }
}
