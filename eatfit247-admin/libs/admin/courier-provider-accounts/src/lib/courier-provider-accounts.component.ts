import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
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
import { ICourierProviderAccount, ITableList } from '@eatfit247-shared-lib';
import { CourierProviderAccountsApiService } from './api.service';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';

@Component({
  selector: 'lib-courier-provider-accounts',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './courier-provider-accounts.html',
  styleUrl: './courier-provider-accounts.scss'
})
export class CourierProviderAccounts implements OnInit {
  data: ICourierProviderAccount[] = [];
  totalCount = 0;
  loading = false;
  tableConfig!: ITableConfig<ICourierProviderAccount>;
  private searchSubject = new Subject<string>();
  currentSearch = '';

  constructor(
    private apiService: CourierProviderAccountsApiService,
    private router: Router
  ) {
    this.setupSearch();
  }

  ngOnInit(): void {
    this.initializeTable();
    this.loadData();
  }

  private initializeTable(): void {
    const columns: ITableColumn<ICourierProviderAccount>[] = [
      { key: 'providerAccountId', label: 'ID', dataKey: 'providerAccountId', sortable: true, width: '80px' },
      {
        key: 'provider',
        label: 'Provider',
        dataKey: 'provider',
        sortable: false,
        formatter: (value) => (value?.providerName || '-')
      },
      {
        key: 'franchise',
        label: 'Franchise',
        dataKey: 'franchise',
        sortable: false,
        formatter: (value) => (value?.companyName || '-')
      },
      {
        key: 'accountName',
        label: 'Account Name',
        dataKey: 'accountName',
        sortable: true,
        searchable: true,
        formatter: (value) => value || '-'
      },
      {
        key: 'apiBaseUrl',
        label: 'API Base URL',
        dataKey: 'apiBaseUrl',
        sortable: false,
        formatter: (value) => value || '-'
      },
      {
        key: 'active',
        label: 'Status',
        dataKey: 'active',
        sortable: true,
        width: '120px',
        align: 'center',
        formatter: (value) => (value ? 'Active' : 'Inactive')
      },
      {
        key: 'createdByUser',
        label: 'Created By',
        dataKey: 'createdByUser',
        sortable: false,
        formatter: createdByUserFormatter()
      },
      {
        key: 'updatedByUser',
        label: 'Updated By',
        dataKey: 'updatedByUser',
        sortable: false,
        formatter: updatedByUserFormatter()
      },
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
      }
    ];
    const actions: ITableAction<ICourierProviderAccount>[] = [
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
      searchPlaceholder: 'Search courier provider accounts...',
      showPagination: true,
      pageSize: 10,
      pageSizeOptions: [5, 10, 25, 50],
      showHeader: true,
      emptyMessage: 'No courier provider accounts found'
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
      const response: ITableList<ICourierProviderAccount> = await this.apiService.getList({
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
      const response: ITableList<ICourierProviderAccount> = await this.apiService.getList({
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
      const response: ITableList<ICourierProviderAccount> = await this.apiService.getList({
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

  editItem(item: ICourierProviderAccount): void {
    this.router.navigate(['/delivery/courier-provider-accounts/edit', item.providerAccountId]);
  }

  createItem(): void {
    this.router.navigate(['/delivery/courier-provider-accounts/new']);
  }

  async toggleStatus(item: ICourierProviderAccount): Promise<void> {
    const action = item.active ? 'deactivate' : 'activate';
    const accountName = item.accountName || `Account ${item.providerAccountId}`;
    const confirmed = confirm(`Are you sure you want to ${action} "${accountName}"?`);
    if (confirmed) {
      this.loading = true;
      try {
        await this.apiService.updateStatus(item.providerAccountId, !item.active);
        await this.loadData();
        this.loading = false;
      } catch {
        this.loading = false;
      }
    }
  }
}

