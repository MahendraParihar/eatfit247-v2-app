import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseListComponent, DataTableComponent, ITableColumn } from '@shared';
import { IIssueCategory } from '@eatfit247-shared-lib';
import { IssueCategoryApiService } from '../api.service';

@Component({
  selector: 'lib-issue-category',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  templateUrl: './issue-category.html',
  styleUrl: './issue-category.scss',
})
export class IssueCategory extends BaseListComponent<IIssueCategory> {
  protected apiService = inject(IssueCategoryApiService);

  protected listConfig = {
    editRoute: '/lov-master/issue-category/edit',
    createRoute: '/lov-master/issue-category/new',
    searchPlaceholder: 'Search issue category...',
    emptyMessage: 'No issue category records found',
  };

  protected buildEntityColumns(): ITableColumn<IIssueCategory>[] {
    return [
      { key: 'issueCategoryId', label: 'ID', dataKey: 'issueCategoryId', sortable: true, width: '80px' },
      { key: 'issueCategory', label: 'Issue Category', dataKey: 'issueCategory', sortable: true, searchable: true },
    ];
  }

  protected getItemId(item: IIssueCategory): number { return item.issueCategoryId; }
  protected getItemDisplayName(item: IIssueCategory): string { return item.issueCategory; }
}
