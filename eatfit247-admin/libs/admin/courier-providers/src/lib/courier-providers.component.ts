import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
import { ICourierProvider, ITableList } from '@eatfit247-shared-lib';
import { CourierProvidersApiService } from './api.service';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';

@Component({
  selector: 'lib-courier-providers',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './courier-providers.html',
  styleUrl: './courier-providers.scss'
})
export class CourierProviders implements OnInit {
  private apiService = inject(CourierProvidersApiService);
  private router = inject(Router);

  data: ICourierProvider[] = [];
  totalCount = 0;
  loading = false;
  tableConfig!: ITableConfig<ICourierProvider>;
  private searchSubject = new Subject<string>();
  currentSearch = '';

  constructor() {
    this.setupSearch();
  }

  ngOnInit(): void {
    this.initializeTable();
    this.loadData();
  }

  private initializeTable(): void {
    const columns: ITableColumn<ICourierProvider>[] = [
      {
        key: 'courierProviderId',
        label: 'ID',
        dataKey: 'courierProviderId',
        sortable: true,
        width: '80px',
      },
      {
        key: 'providerCode',
        label: 'Provider Code',
        dataKey: 'providerCode',
        sortable: true,
        searchable: true,
      },
      {
        key: 'providerName',
        label: 'Provider Name',
        dataKey: 'providerName',
        sortable: true,
        searchable: true,
      },
      {
        key: 'authType',
        label: 'Auth Type',
        dataKey: 'authType',
        sortable: true,
        formatter: (value) => value || '-',
      },
      {
        key: 'supportsRateApi',
        label: 'Rate API',
        dataKey: 'supportsRateApi',
        sortable: true,
        width: '100px',
        align: 'center',
        formatter: (value) => (value ? 'Yes' : 'No'),
      },
      {
        key: 'supportsWebhook',
        label: 'Webhook',
        dataKey: 'supportsWebhook',
        sortable: true,
        width: '100px',
        align: 'center',
        formatter: (value) => (value ? 'Yes' : 'No'),
      },
      {
        key: 'supportsCod',
        label: 'COD',
        dataKey: 'supportsCod',
        sortable: true,
        width: '100px',
        align: 'center',
        formatter: (value) => (value ? 'Yes' : 'No'),
      },
      {
        key: 'priorityOrder',
        label: 'Priority',
        dataKey: 'priorityOrder',
        sortable: true,
        width: '100px',
        align: 'center',
      },
      {
        key: 'active',
        label: 'Status',
        dataKey: 'active',
        sortable: true,
        width: '120px',
        align: 'center',
        formatter: (value) => (value ? 'Active' : 'Inactive'),
      },
      {
        key: 'createdByUser',
        label: 'Created By',
        dataKey: 'createdByUser',
        sortable: false,
        formatter: createdByUserFormatter(),
      },
      {
        key: 'updatedByUser',
        label: 'Updated By',
        dataKey: 'updatedByUser',
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
    const actions: ITableAction<ICourierProvider>[] = [
      { label: 'Edit', icon: 'edit', color: 'primary', onClick: (row) => this.editItem(row) },
      {
        label: 'Active',
        icon: 'check_circle',
        color: 'primary',
        visible: (row) => !row.active,
        onClick: (row) => this.toggleStatus(row)
      },
      {
        label: 'Inactive',
        icon: 'cancel',
        color: 'warn',
        visible: (row) => row.active,
        onClick: (row) => this.toggleStatus(row)
      }
    ];
    this.tableConfig = {
      columns,
      actions,
      showSearch: true,
      searchPlaceholder: 'Search courier providers...',
      showPagination: true,
      pageSize: 10,
      pageSizeOptions: [5, 10, 25, 50],
      showHeader: true,
      emptyMessage: 'No courier providers found'
    };
  }

  private setupSearch(): void {
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged(), switchMap((search) => {
      this.loading = true;
      return this.apiService.getList({ search, page: 0, limit: this.tableConfig.pageSize || 10 });
    })).subscribe({
      next: (response) => {
        this.data = response.tableData;
        this.totalCount = response.count;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  async loadData(): Promise<void> {
    this.loading = true;
    try {
      const response: ITableList<ICourierProvider> = await this.apiService.getList({
        page: 0,
        limit: this.tableConfig.pageSize || 10,
        search: this.currentSearch?.trim() || undefined
      });
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
      const response: ITableList<ICourierProvider> = await this.apiService.getList({
        page: pagination.pageIndex,
        limit: pagination.pageSize,
        search: this.currentSearch?.trim() || undefined
      });
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
      const response: ITableList<ICourierProvider> = await this.apiService.getList({
        page: 0,
        limit: this.tableConfig.pageSize || 10,
        sortBy: sort.active,
        sortOrder: sort.direction,
        search: this.currentSearch?.trim() || undefined
      });
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

  editItem(item: ICourierProvider): void {
    this.router.navigate([
      '/delivery/courier-providers/edit',
      item.courierProviderId,
    ]);
  }

  createItem(): void {
    this.router.navigate(['/delivery/courier-providers/new']);
  }

  async toggleStatus(item: ICourierProvider): Promise<void> {
    const action = item.active ? 'deactivate' : 'activate';
    const confirmed = confirm(`Are you sure you want to ${action} "${item.providerName}"?`);
    if (confirmed) {
      this.loading = true;
      try {
        await this.apiService.updateStatus(
          item.courierProviderId,
          !item.active
        );
        await this.loadData();
        this.loading = false;
      } catch {
        this.loading = false;
      }
    }
  }
}

