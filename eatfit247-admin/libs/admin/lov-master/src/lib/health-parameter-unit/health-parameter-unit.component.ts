import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BaseListComponent, DataTableComponent, ITableColumn } from '@shared';
import { IHealthParameterUnit } from '@eatfit247-shared-lib';
import { HealthParameterUnitApiService } from '../api.service';

@Component({
  selector: 'lib-health-parameter-unit',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './health-parameter-unit.html',
  styleUrl: './health-parameter-unit.scss',
})
export class HealthParameterUnit extends BaseListComponent<IHealthParameterUnit> {
  protected apiService = inject(HealthParameterUnitApiService);

  protected listConfig = {
    editRoute: '/lov-master/health-parameter-unit/edit',
    createRoute: '/lov-master/health-parameter-unit/new',
    searchPlaceholder: 'Search health parameter unit...',
    emptyMessage: 'No health parameter unit records found',
  };

  protected buildEntityColumns(): ITableColumn<IHealthParameterUnit>[] {
    return [
      { key: 'healthParameterUnitId', label: 'ID', dataKey: 'healthParameterUnitId', sortable: true, width: '80px' },
      { key: 'healthParameterUnit', label: 'Health Parameter Unit', dataKey: 'healthParameterUnit', sortable: true, searchable: true },
    ];
  }

  protected getItemId(item: IHealthParameterUnit): number { return item.healthParameterUnitId; }
  protected getItemDisplayName(item: IHealthParameterUnit): string { return item.healthParameterUnit; }
}
