import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BaseListComponent, DataTableComponent, ITableColumn } from '@shared';
import { IHealthIssue } from '@eatfit247-shared-lib';
import { HealthIssueApiService } from '../api.service';

@Component({
  selector: 'lib-health-issue',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './health-issue.html',
  styleUrl: './health-issue.scss',
})
export class HealthIssue extends BaseListComponent<IHealthIssue> {
  protected apiService = inject(HealthIssueApiService);

  protected listConfig = {
    editRoute: '/lov-master/health-issue/edit',
    createRoute: '/lov-master/health-issue/new',
    searchPlaceholder: 'Search health issue...',
    emptyMessage: 'No health issue records found',
  };

  protected buildEntityColumns(): ITableColumn<IHealthIssue>[] {
    return [
      { key: 'healthIssueId', label: 'ID', dataKey: 'healthIssueId', sortable: true, width: '80px' },
      { key: 'healthIssue', label: 'Health Issue', dataKey: 'healthIssue', sortable: true, searchable: true },
      { key: 'image', label: 'Image', dataKey: 'imagePath', type: 'image', isAvatar: true, imageAlt: 'Health Issue Image', sortable: false, width: '80px', align: 'center' },
    ];
  }

  protected getItemId(item: IHealthIssue): number { return item.healthIssueId; }
  protected getItemDisplayName(item: IHealthIssue): string { return item.healthIssue; }
}
