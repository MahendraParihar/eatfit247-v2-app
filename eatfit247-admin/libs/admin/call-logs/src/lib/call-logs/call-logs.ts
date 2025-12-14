import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent, TableColumn, TableConfig, TableAction, createdByUserFormatter, updatedByUserFormatter } from '@shared';
import { ITableList } from '@eatfit247-shared-lib';
import { CallLogsApiService } from '../api.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

@Component({
  selector: 'lib-call-logs',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  templateUrl: './call-logs.html',
  styleUrl: './call-logs.scss',
})
export class CallLogs implements OnInit {
  data: any[] = [];
  totalCount = 0;
  loading = false;
  tableConfig!: TableConfig<any>;
  private searchSubject = new Subject<string>();

  constructor(private apiService: CallLogsApiService) {
    this.setupSearch();
  }

  ngOnInit(): void {
    this.initializeTable();
    this.loadData();
  }

  private initializeTable(): void {
    const columns: TableColumn<any>[] = [
      { key: 'callLogId', label: 'ID', dataKey: 'callLogId', sortable: true, width: '80px' },
      { key: 'member', label: 'Member', dataKey: 'member', sortable: false, formatter: (value) => value ? `${value.firstName || ''} ${value.lastName || ''}`.trim() || '-' : '-' },
      { key: 'callPurpose', label: 'Purpose', dataKey: 'callPurpose', sortable: false, formatter: (value) => value?.callPurpose || '-' },
      { key: 'callType', label: 'Type', dataKey: 'callType', sortable: false, formatter: (value) => value?.callType || '-' },
      { key: 'callLogStatus', label: 'Status', dataKey: 'callLogStatus', sortable: false, formatter: (value) => value?.callLogStatus || '-' },
      { key: 'callDate', label: 'Call Date', dataKey: 'callDate', sortable: true, formatter: (value) => (value ? new Date(value).toLocaleDateString() : '') },
      { key: 'nextFollowUpDate', label: 'Next Follow Up', dataKey: 'nextFollowUpDate', sortable: true, formatter: (value) => (value ? new Date(value).toLocaleDateString() : '-') },
      { key: 'createdByUser', label: 'Created By', dataKey: 'createdByUser', sortable: false, formatter: createdByUserFormatter() },
      { key: 'updatedByUser', label: 'Updated By', dataKey: 'updatedByUser', sortable: false, formatter: updatedByUserFormatter() },
      { key: 'createdAt', label: 'Created At', dataKey: 'createdAt', sortable: true, formatter: (value) => (value ? new Date(value).toLocaleString() : '') },
      { key: 'updatedAt', label: 'Updated At', dataKey: 'updatedAt', sortable: true, formatter: (value) => (value ? new Date(value).toLocaleString() : '') },
    ];

    const actions: TableAction<any>[] = [
      { label: 'Edit', icon: 'edit', color: 'primary', onClick: (row) => this.editItem(row) },
      { label: 'View', icon: 'visibility', color: 'primary', onClick: (row) => this.viewItem(row) },
    ];

    this.tableConfig = {
      columns,
      actions,
      showSearch: true,
      searchPlaceholder: 'Search call logs...',
      showPagination: true,
      pageSize: 10,
      pageSizeOptions: [5, 10, 25, 50],
      showHeader: true,
      emptyMessage: 'No call logs found',
    };
  }

  private setupSearch(): void {
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged(), switchMap((search) => {
      this.loading = true;
      return this.apiService.getList({ search, page: 0, limit: this.tableConfig.pageSize || 10 });
    })).subscribe({
      next: (response) => { this.data = response.data; this.totalCount = response.count; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  async loadData(): Promise<void> {
    this.loading = true;
    try {
      const response: ITableList<any> = await this.apiService.getList({ page: 0, limit: this.tableConfig.pageSize || 10 });
      this.data = response.data;
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
      this.data = response.data;
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
      this.data = response.data;
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
    console.log('Edit call log:', item);
  }

  viewItem(item: any): void {
    console.log('View call log:', item);
  }
}
