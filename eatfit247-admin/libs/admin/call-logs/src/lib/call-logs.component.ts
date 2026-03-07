import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  createdByUserFormatter,
  DataTableComponent,
  ITableAction,
  ITableColumn,
  ITableConfig,
  updatedByUserFormatter
} from '@shared';
import { IMemberCallLog, ITableList } from '@eatfit247-shared-lib';
import { CallLogsApiService } from './api.service';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';

@Component({
  selector: 'lib-call-logs',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './call-logs.html',
  styleUrl: './call-logs.scss',
})
export class CallLogs implements OnInit {
  data: IMemberCallLog[] = [];
  totalCount = 0;
  loading = false;
  tableConfig!: ITableConfig<IMemberCallLog>;
  private searchSubject = new Subject<string>();
  currentSearch = '';

  constructor(
    private apiService: CallLogsApiService,
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
    const columns: ITableColumn<IMemberCallLog>[] = [
      {
        key: 'memberCallLogId',
        label: 'ID',
        dataKey: 'memberCallLogId',
        sortable: true,
        width: '80px',
      },
      {
        key: 'memberName',
        label: 'Member',
        dataKey: 'memberName',
        sortable: false,
        searchable: true,
      },
      {
        key: 'date',
        label: 'Date',
        dataKey: 'date',
        sortable: true,
        width: '120px',
        formatter: (value) => this.formatDate(value),
      },
      {
        key: 'startTime',
        label: 'Start Time',
        dataKey: 'startTime',
        sortable: true,
        width: '120px',
        formatter: (value) => this.formatTime(value),
      },
      {
        key: 'endTime',
        label: 'End Time',
        dataKey: 'endTime',
        sortable: true,
        width: '120px',
        formatter: (value) => this.formatTime(value),
      },
      {
        key: 'callType',
        label: 'Call Type',
        dataKey: 'callType',
        sortable: false,
      },
      {
        key: 'callPurpose',
        label: 'Call Purpose',
        dataKey: 'callPurpose',
        sortable: false,
      },
      {
        key: 'callLogStatus',
        label: 'Status',
        dataKey: 'callLogStatus',
        sortable: false,
      },
      { key: 'detail', label: 'Detail', dataKey: 'detail', sortable: false },
      {
        key: 'active',
        label: 'Active',
        dataKey: 'active',
        sortable: true,
        width: '100px',
        align: 'center',
        formatter: (value) => (value ? 'Yes' : 'No'),
      },
      {
        key: 'createdBy',
        label: 'Created By',
        dataKey: 'createdBy',
        sortable: false,
        formatter: createdByUserFormatter(),
      },
      {
        key: 'updatedBy',
        label: 'Updated By',
        dataKey: 'updatedBy',
        sortable: false,
        formatter: updatedByUserFormatter(),
      },
      {
        key: 'createdAt',
        label: 'Created At',
        dataKey: 'createdAt',
        type: 'date',
        sortable: true,
      },
      {
        key: 'updatedAt',
        label: 'Updated At',
        dataKey: 'updatedAt',
        type: 'date',
        sortable: true,
      },
    ];

    const actions: ITableAction<IMemberCallLog>[] = [
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

  private formatDate(value: any): string {
    if (!value) return '';
    const date = new Date(value);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  private formatTime(value: any): string {
    if (!value) return '';
    // Handle both string time format (HH:mm:ss) and Date objects
    if (typeof value === 'string') {
      return value.substring(0, 5); // Return HH:mm format
    }
    return value;
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
      const response: ITableList<IMemberCallLog> = await this.apiService.getList({ page: 0, limit: this.tableConfig.pageSize || 10, search: this.currentSearch?.trim() || undefined });
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
      const response: ITableList<IMemberCallLog> = await this.apiService.getList({ page: pagination.pageIndex, limit: pagination.pageSize, search: this.currentSearch?.trim() || undefined });
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
      const response: ITableList<IMemberCallLog> = await this.apiService.getList({ page: 0, limit: this.tableConfig.pageSize || 10, sortBy: sort.active, sortOrder: sort.direction, search: this.currentSearch?.trim() || undefined });
      this.data = response.tableData;
      this.totalCount = response.count;
      this.loading = false;
    } catch {
      this.loading = false;
    }
  }

  onSearchChange(search: string): void {
    this.currentSearch = search;
    this.searchSubject.next(search);
  }

  editItem(item: IMemberCallLog): void {
    this.router.navigate(['/call-logs/edit', item.memberCallLogId]);
  }

  createItem(): void {
    this.router.navigate(['/call-logs/new']);
  }

  viewItem(item: IMemberCallLog): void {
    // Navigate to member details page showing this call log, or just show member details
    this.router.navigate(['/members/details', item.memberId, 'call-logs']);
  }
}
