import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BaseListComponent, DataTableComponent, ITableColumn } from '@shared';
import { IHealthParameter } from '@eatfit247-shared-lib';
import { HealthParameterApiService } from '../api.service';

@Component({
  selector: 'lib-health-parameter',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './health-parameter.html',
  styleUrl: './health-parameter.scss',
})
export class HealthParameter extends BaseListComponent<IHealthParameter> {
  protected apiService = inject(HealthParameterApiService);

  protected listConfig = {
    editRoute: '/lov-master/health-parameter/edit',
    createRoute: '/lov-master/health-parameter/new',
    searchPlaceholder: 'Search health parameter...',
    emptyMessage: 'No health parameter records found',
  };

  protected buildEntityColumns(): ITableColumn<IHealthParameter>[] {
    return [
      { key: 'healthParameterId', label: 'ID', dataKey: 'healthParameterId', sortable: true, width: '80px' },
      { key: 'healthParameter', label: 'Health Parameter', dataKey: 'healthParameter', sortable: true, searchable: true },
      { key: 'image', label: 'Image', dataKey: 'imagePath', type: 'image', isAvatar: true, imageAlt: 'Health Parameter Image', sortable: false, width: '80px', align: 'center' },
    ];
  }

  protected getItemId(item: IHealthParameter): number { return item.healthParameterId; }
  protected getItemDisplayName(item: IHealthParameter): string { return item.healthParameter; }
}
