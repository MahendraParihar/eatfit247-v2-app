import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BaseListComponent, DataTableComponent, ITableAction, ITableColumn } from '@shared';
import { IIssue } from '@eatfit247-shared-lib';
import { IssuesApiService } from './api.service';

@Component({
  selector: 'lib-issues',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './issues.html',
  styleUrl: './issues.scss',
})
export class Issues extends BaseListComponent<IIssue> {
  protected apiService = inject(IssuesApiService);

  protected listConfig = {
    editRoute: '/issues/edit',
    createRoute: '/issues/new',
    searchPlaceholder: 'Search issues...',
    emptyMessage: 'No issues found',
  };

  protected buildEntityColumns(): ITableColumn<IIssue>[] {
    return [
      { key: 'issueId', label: 'ID', dataKey: 'issueId', sortable: true, width: '80px' },
      {
        key: 'member', label: 'Member', dataKey: 'member', sortable: false,
        formatter: (value) => value ? `${value.firstName || ''} ${value.lastName || ''}`.trim() || '-' : '-',
      },
      {
        key: 'issueCategory', label: 'Category', dataKey: 'issueCategory', sortable: false,
        formatter: (value) => value?.issueCategory || '-',
      },
      {
        key: 'issueStatus', label: 'Status', dataKey: 'issueStatus', sortable: false,
        formatter: (value) => value?.issueStatus || '-',
      },
      { key: 'subject', label: 'Subject', dataKey: 'subject', sortable: true, searchable: true },
      {
        key: 'issueDate', label: 'Issue Date', dataKey: 'issueDate', sortable: true,
        formatter: (value) => (value ? new Date(value).toLocaleDateString() : ''),
      },
      {
        key: 'resolvedDate', label: 'Resolved Date', dataKey: 'resolvedDate', sortable: true,
        formatter: (value) => (value ? new Date(value).toLocaleDateString() : '-'),
      },
    ];
  }

  protected override buildExtraActions(): ITableAction<IIssue>[] {
    return [
      { label: 'View', icon: 'visibility', color: 'primary', onClick: (row) => this.viewItem(row) },
    ];
  }

  protected getItemId(item: IIssue): number { return item.issueId; }
  protected getItemDisplayName(item: IIssue): string { return item.subject; }

  viewItem(item: IIssue): void {
    // View functionality can be implemented here if needed
  }
}
