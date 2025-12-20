import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DataTableComponent, ITableColumn, ITableConfig, ITableAction, createdByUserFormatter, updatedByUserFormatter } from '@shared';
import { ITableList } from '@eatfit247-shared-lib';
import { IssuesApiService } from './api.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

@Component({
  selector: 'lib-issues',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './issues.html',
  styleUrl: './issues.scss',
})
export class Issues implements OnInit {
  data: any[] = [];
  totalCount = 0;
  loading = false;
  tableConfig!: ITableConfig<any>;
  private searchSubject = new Subject<string>();

  constructor(
    private apiService: IssuesApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.setupSearch();
  }

  ngOnInit(): void {
    this.initializeTable();
    this.loadData();
  }

  private initializeTable(): void {
    const columns: ITableColumn<any>[] = [
      { key: 'issueId', label: 'ID', dataKey: 'issueId', sortable: true, width: '80px' },
      { key: 'member', label: 'Member', dataKey: 'member', sortable: false, formatter: (value) => value ? `${value.firstName || ''} ${value.lastName || ''}`.trim() || '-' : '-' },
      { key: 'issueCategory', label: 'Category', dataKey: 'issueCategory', sortable: false, formatter: (value) => value?.issueCategory || '-' },
      { key: 'issueStatus', label: 'Status', dataKey: 'issueStatus', sortable: false, formatter: (value) => value?.issueStatus || '-' },
      { key: 'subject', label: 'Subject', dataKey: 'subject', sortable: true, searchable: true },
      { key: 'issueDate', label: 'Issue Date', dataKey: 'issueDate', sortable: true, formatter: (value) => (value ? new Date(value).toLocaleDateString() : '') },
      { key: 'resolvedDate', label: 'Resolved Date', dataKey: 'resolvedDate', sortable: true, formatter: (value) => (value ? new Date(value).toLocaleDateString() : '-') },
      { key: 'createdByUser', label: 'Created By', dataKey: 'createdByUser', sortable: false, formatter: createdByUserFormatter() },
      { key: 'updatedByUser', label: 'Updated By', dataKey: 'updatedByUser', sortable: false, formatter: updatedByUserFormatter() },
      {
        key: 'createdAt',
        label: 'Created At',
        dataKey: 'createdAt',
        type: 'date',
        sortable: true
      },
      {
        key: 'updatedAt',
        label: 'Updated At',
        dataKey: 'updatedAt',
        type: 'date',
        sortable: true
      },
    ];

    const actions: ITableAction<any>[] = [
      { label: 'Edit', icon: 'edit', color: 'primary', onClick: (row) => this.editItem(row) },
      { label: 'View', icon: 'visibility', color: 'primary', onClick: (row) => this.viewItem(row) },
    ];

    this.tableConfig = {
      columns,
      actions,
      showSearch: true,
      searchPlaceholder: 'Search issues...',
      showPagination: true,
      pageSize: 10,
      pageSizeOptions: [5, 10, 25, 50],
      showHeader: true,
      emptyMessage: 'No issues found',
    };
  }

  private setupSearch(): void {
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged(), switchMap((search) => {
      this.loading = true;
      return this.apiService.getList({ search, page: 0, limit: this.tableConfig.pageSize || 10 });
    })).subscribe({
      next: (response) => { this.data = response.tableData; this.totalCount = response.count; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  async loadData(): Promise<void> {
    this.loading = true;
    try {
      const response: ITableList<any> = await this.apiService.getList({ page: 0, limit: this.tableConfig.pageSize || 10 });
      this.data = response.tableData;
      this.totalCount = response.count;
      this.loading = false;
    } catch {
      this.loading = false;
    }
  }

  async onPageChange(pagination: any): Promise<void> {
    this.loading = true;
    try {
      const response: ITableList<any> = await this.apiService.getList({ page: pagination.pageIndex, limit: pagination.pageSize });
      this.data = response.tableData;
      this.totalCount = response.count;
      this.loading = false;
    } catch {
      this.loading = false;
    }
  }

  async onSortChange(sort: any): Promise<void> {
    this.loading = true;
    try {
      const response: ITableList<any> = await this.apiService.getList({ page: 0, limit: this.tableConfig.pageSize || 10, sortBy: sort.active, sortOrder: sort.direction });
      this.data = response.tableData;
      this.totalCount = response.count;
      this.loading = false;
    } catch {
      this.loading = false;
    }
  }

  onSearchChange(search: string): void {
    this.searchSubject.next(search);
  }

  editItem(item: any): void {
    this.router.navigate(['/issues/edit', item.issueId]);
  }

  createItem(): void {
    this.router.navigate(['/issues/new']);
  }

  viewItem(item: any): void {
    console.log('View issue:', item);
  }
}
