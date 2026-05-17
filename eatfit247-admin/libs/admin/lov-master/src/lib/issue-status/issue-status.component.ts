import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseListComponent, DataTableComponent, ITableColumn } from '@shared';
import { IIssueStatus } from '@eatfit247-shared-lib';
import { IssueStatusApiService } from '../api.service';

@Component({
  selector: 'lib-issue-status',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  templateUrl: './issue-status.html',
  styleUrl: './issue-status.scss',
})
export class IssueStatus extends BaseListComponent<IIssueStatus> {
  protected apiService = inject(IssueStatusApiService);

  protected listConfig = {
    editRoute: '/lov-master/issue-status/edit',
    createRoute: '/lov-master/issue-status/new',
    searchPlaceholder: 'Search issue status...',
    emptyMessage: 'No issue status records found',
  };

  protected buildEntityColumns(): ITableColumn<IIssueStatus>[] {
    return [
      { key: 'issueStatusId', label: 'ID', dataKey: 'issueStatusId', sortable: true, width: '80px' },
      { key: 'issueStatus', label: 'Issue Status', dataKey: 'issueStatus', sortable: true, searchable: true },
    ];
  }

  protected getItemId(item: IIssueStatus): number { return item.issueStatusId; }
  protected getItemDisplayName(item: IIssueStatus): string { return item.issueStatus; }
}
