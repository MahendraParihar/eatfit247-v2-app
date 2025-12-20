import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent, ITableColumn, ITableConfig, ITableAction, createdByUserFormatter, updatedByUserFormatter } from '@shared';
import { ITableList } from '@eatfit247-shared-lib';
import { LovMasterApiService } from '../api.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

@Component({
  selector: 'lib-issue-status',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  templateUrl: './issue-status.html',
  styleUrl: './issue-status.scss',
})
export class IssueStatus implements OnInit {
  data: any[] = [];
  totalCount = 0;
  loading = false;
  tableConfig!: ITableConfig<any>;
  private searchSubject = new Subject<string>();

  constructor(private apiService: LovMasterApiService) {
    this.setupSearch();
  }

  ngOnInit(): void {
    this.initializeTable();
    this.loadData();
  }

  private initializeTable(): void {
    const columns: ITableColumn<any>[] = [
      { key: 'issueStatusId', label: 'ID', dataKey: 'issueStatusId', sortable: true, width: '80px' },
      { key: 'issueStatus', label: 'Issue Status', dataKey: 'issueStatus', sortable: true, searchable: true },
      { key: 'active', label: 'Status', dataKey: 'active', sortable: true, width: '120px', align: 'center', formatter: (value) => (value ? 'Active' : 'Inactive') },
      { key: 'createdByUser', label: 'Created By', dataKey: 'createdByUser', sortable: false, formatter: createdByUserFormatter() },
      { key: 'updatedByUser', label: 'Updated By', dataKey: 'updatedByUser', sortable: false, formatter: updatedByUserFormatter() },
      { key: 'createdAt', label: 'Created At', dataKey: 'createdAt', sortable: true, formatter: (value) => (value ? new Date(value).toLocaleString() : '') },
      { key: 'updatedAt', label: 'Updated At', dataKey: 'updatedAt', sortable: true, formatter: (value) => (value ? new Date(value).toLocaleString() : '') },
    ];

    const actions: ITableAction<any>[] = [
      { label: 'Edit', icon: 'edit', color: 'primary', onClick: (row) => this.editItem(row) },
      { label: 'Active', icon: 'check_circle', color: 'primary', visible: (row) => row.active === true, onClick: (row) => this.toggleStatus(row) },
      { label: 'Inactive', icon: 'cancel', color: 'warn', visible: (row) => row.active === false, onClick: (row) => this.toggleStatus(row) },
    ];

    this.tableConfig = {
      columns,
      actions,
      showSearch: true,
      searchPlaceholder: 'Search issue status...',
      showPagination: true,
      pageSize: 10,
      pageSizeOptions: [5, 10, 25, 50],
      showHeader: true,
      emptyMessage: 'No issue status records found',
    };
  }

  private setupSearch(): void {
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged(), switchMap((search) => {
      this.loading = true;
      return this.apiService.getIssueStatusList({ search, page: 0, limit: this.tableConfig.pageSize || 10 });
    })).subscribe({
      next: (response) => { this.data = response.tableData; this.totalCount = response.count; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  async loadData(): Promise<void> {
    this.loading = true;
    try {
      const response: ITableList<any> = await this.apiService.getIssueStatusList({ page: 0, limit: this.tableConfig.pageSize || 10 });
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
      const response: ITableList<any> = await this.apiService.getIssueStatusList({ page: pagination.pageIndex, limit: pagination.pageSize });
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
      const response: ITableList<any> = await this.apiService.getIssueStatusList({ page: 0, limit: this.tableConfig.pageSize || 10, sortBy: sort.active, sortOrder: sort.direction });
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
    console.log('Edit issue status:', item);
  }

  async toggleStatus(item: any): Promise<void> {
    const action = item.active ? 'deactivate' : 'activate';
    const confirmed = confirm(`Are you sure you want to ${action} "${item.issueStatus || item.name}"?`);
    if (confirmed) {
      this.loading = true;
      try {
        await this.apiService.updateIssueStatusStatus(item.issueStatusId, !item.active);
        await this.loadData();
      } catch {
        this.loading = false;
      }
    }
  }
}
