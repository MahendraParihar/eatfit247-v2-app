import { Component, OnInit } from '@angular/core';
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
import { IWarehouse, ITableList } from '@eatfit247-shared-lib';
import { WarehousesApiService } from './api.service';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';

@Component({
  selector: 'lib-warehouses',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './warehouses.html',
  styleUrl: './warehouses.scss'
})
export class Warehouses implements OnInit {
  data: IWarehouse[] = [];
  totalCount = 0;
  loading = false;
  tableConfig!: ITableConfig<IWarehouse>;
  private searchSubject = new Subject<string>();
  currentSearch = '';

  constructor(
    private apiService: WarehousesApiService,
    private router: Router
  ) {
    this.setupSearch();
  }

  ngOnInit(): void {
    this.initializeTable();
    this.loadData();
  }

  private initializeTable(): void {
    const columns: ITableColumn<IWarehouse>[] = [
      { key: 'warehouseId', label: 'ID', dataKey: 'warehouseId', sortable: true, width: '80px' },
      { key: 'name', label: 'Name', dataKey: 'name', sortable: true, searchable: true },
      { key: 'contactName', label: 'Contact', dataKey: 'contactName', sortable: true, formatter: (v) => v ?? '-' },
      { key: 'city', label: 'City', dataKey: 'city', sortable: true },
      { key: 'pinCode', label: 'Pin Code', dataKey: 'pinCode', sortable: true },
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
      { key: 'createdAt', label: 'Created At', dataKey: 'createdAt', type: 'date', sortable: true },
      { key: 'updatedAt', label: 'Updated At', dataKey: 'updatedAt', type: 'date', sortable: true }
    ];
    const actions: ITableAction<IWarehouse>[] = [
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
      searchPlaceholder: 'Search warehouses...',
      showPagination: true,
      pageSize: 10,
      pageSizeOptions: [5, 10, 25, 50],
      showHeader: true,
      emptyMessage: 'No warehouses found'
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
      const response: ITableList<IWarehouse> = await this.apiService.getList({
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
      const response: ITableList<IWarehouse> = await this.apiService.getList({
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
      const response: ITableList<IWarehouse> = await this.apiService.getList({
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

  editItem(item: IWarehouse): void {
    this.router.navigate(['/delivery/warehouses/edit', item.warehouseId]);
  }

  createItem(): void {
    this.router.navigate(['/delivery/warehouses/new']);
  }

  async toggleStatus(item: IWarehouse): Promise<void> {
    const action = item.active ? 'deactivate' : 'activate';
    const confirmed = confirm(`Are you sure you want to ${action} "${item.name}"?`);
    if (confirmed) {
      this.loading = true;
      try {
        await this.apiService.updateStatus(item.warehouseId, !item.active);
        await this.loadData();
        this.loading = false;
      } catch {
        this.loading = false;
      }
    }
  }

  async deleteItem(item: IWarehouse): Promise<void> {
    const confirmed = confirm(`Are you sure you want to delete warehouse "${item.name}"?`);
    if (confirmed) {
      this.loading = true;
      try {
        await this.apiService.delete(item.warehouseId);
        await this.loadData();
        this.loading = false;
      } catch {
        this.loading = false;
      }
    }
  }
}
