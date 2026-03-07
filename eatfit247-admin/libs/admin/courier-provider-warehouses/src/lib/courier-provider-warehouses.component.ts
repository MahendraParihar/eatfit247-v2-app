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
import { ICourierProviderWarehouse, ITableList } from '@eatfit247-shared-lib';
import { CourierProviderWarehousesApiService } from './api.service';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';

@Component({
  selector: 'lib-courier-provider-warehouses',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './courier-provider-warehouses.html',
  styleUrl: './courier-provider-warehouses.scss'
})
export class CourierProviderWarehouses implements OnInit {
  private apiService = inject(CourierProviderWarehousesApiService);
  private router = inject(Router);

  data: ICourierProviderWarehouse[] = [];
  totalCount = 0;
  loading = false;
  tableConfig!: ITableConfig<ICourierProviderWarehouse>;
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
    const columns: ITableColumn<ICourierProviderWarehouse>[] = [
      {
        key: 'courierProviderWarehouseId',
        label: 'ID',
        dataKey: 'courierProviderWarehouseId',
        sortable: true,
        width: '80px'
      },
      {
        key: 'warehouse',
        label: 'Warehouse',
        dataKey: 'warehouse',
        sortable: false,
        formatter: (v) => (v && typeof v === 'object' && 'name' in v ? (v as { name: string }).name : '-')
      },
      {
        key: 'provider',
        label: 'Provider',
        dataKey: 'provider',
        sortable: false,
        formatter: (v) => (v && typeof v === 'object' && 'providerName' in v ? (v as { providerName: string }).providerName : '-')
      },
      {
        key: 'providerWarehouseName',
        label: 'Provider Warehouse',
        dataKey: 'providerWarehouseName',
        sortable: true,
        formatter: (v) => v ?? '-'
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
      { key: 'updatedAt', label: 'Updated At', dataKey: 'updatedAt', type: 'date', sortable: true }
    ];
    const actions: ITableAction<ICourierProviderWarehouse>[] = [
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
      },
      { label: 'Delete', icon: 'delete', color: 'warn', onClick: (row) => this.deleteItem(row) }
    ];
    this.tableConfig = {
      columns,
      actions,
      showSearch: true,
      searchPlaceholder: 'Search provider warehouse mappings...',
      showPagination: true,
      pageSize: 10,
      pageSizeOptions: [5, 10, 25, 50],
      showHeader: true,
      emptyMessage: 'No provider warehouse mappings found'
    };
  }

  private setupSearch(): void {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((search) => {
          this.loading = true;
          return this.apiService.getList({ search, page: 0, limit: this.tableConfig?.pageSize ?? 10 });
        })
      )
      .subscribe({
        next: (response) => {
          this.data = response.tableData;
          this.totalCount = response.count;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  async loadData(): Promise<void> {
    this.loading = true;
    try {
      const response: ITableList<ICourierProviderWarehouse> = await this.apiService.getList({
        page: 0,
        limit: this.tableConfig.pageSize ?? 10,
        search: this.currentSearch?.trim() || undefined
      });
      this.data = response.tableData;
      this.totalCount = response.count;
      this.loading = false;
    } catch {
      this.loading = false;
    }
  }

  async onPageChange(pagination: { pageIndex: number; pageSize: number }): Promise<void> {
    this.loading = true;
    try {
      const response: ITableList<ICourierProviderWarehouse> = await this.apiService.getList({
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

  async onSortChange(sort: { active: string; direction: string }): Promise<void> {
    this.loading = true;
    try {
      const response: ITableList<ICourierProviderWarehouse> = await this.apiService.getList({
        page: 0,
        limit: this.tableConfig.pageSize ?? 10,
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

  editItem(item: ICourierProviderWarehouse): void {
    this.router.navigate(['/delivery/courier-provider-warehouses/edit', item.courierProviderWarehouseId]);
  }

  createItem(): void {
    this.router.navigate(['/delivery/courier-provider-warehouses/new']);
  }

  async toggleStatus(item: ICourierProviderWarehouse): Promise<void> {
    const name = item.providerWarehouseName ?? `#${item.courierProviderWarehouseId}`;
    const action = item.active ? 'deactivate' : 'activate';
    const confirmed = confirm(`Are you sure you want to ${action} "${name}"?`);
    if (confirmed) {
      this.loading = true;
      try {
        await this.apiService.updateStatus(item.courierProviderWarehouseId, !item.active);
        await this.loadData();
        this.loading = false;
      } catch {
        this.loading = false;
      }
    }
  }

  async deleteItem(item: ICourierProviderWarehouse): Promise<void> {
    const name = item.providerWarehouseName ?? `#${item.courierProviderWarehouseId}`;
    const confirmed = confirm(`Are you sure you want to delete "${name}"?`);
    if (confirmed) {
      this.loading = true;
      try {
        await this.apiService.delete(item.courierProviderWarehouseId);
        await this.loadData();
        this.loading = false;
      } catch {
        this.loading = false;
      }
    }
  }
}
