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
import { IProduct, ITableList } from '@eatfit247-shared-lib';
import { ProductsApiService } from './api.service';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';

@Component({
  selector: 'lib-products',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './products.html',
  styleUrl: './products.scss'
})
export class Products implements OnInit {
  data: IProduct[] = [];
  totalCount = 0;
  loading = false;
  tableConfig!: ITableConfig<IProduct>;
  private searchSubject = new Subject<string>();
  currentSearch = '';

  constructor(
    private apiService: ProductsApiService,
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
    const columns: ITableColumn<IProduct>[] = [
      { key: 'productId', label: 'ID', dataKey: 'productId', sortable: true, width: '80px' },
      {
        key: 'image',
        label: 'Image',
        isAvatar: true,
        dataKey: 'imagePath',
        sortable: false,
        type: 'image',
        formatter: (value) => {
          if (value && Array.isArray(value) && value.length > 0) {
            return value[0]?.url || value[0]?.path || '';
          }
          return '';
        }
      },
      { key: 'name', label: 'Name', dataKey: 'name', sortable: true, searchable: true },
      {
        key: 'priceRange',
        label: 'Price Range',
        dataKey: 'additionalInfo.priceRange',
        sortable: false,
        formatter: (value, row) => {
          const priceRange = row?.additionalInfo?.priceRange;
          if (priceRange && priceRange.min !== undefined && priceRange.max !== undefined) {
            return `₹${priceRange.min} - ₹${priceRange.max}`;
          }
          return '-';
        }
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
    const actions: ITableAction<IProduct>[] = [
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
      searchPlaceholder: 'Search products...',
      showPagination: true,
      pageSize: 10,
      pageSizeOptions: [5, 10, 25, 50],
      showHeader: true,
      emptyMessage: 'No products found'
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
      const response: ITableList<IProduct> = await this.apiService.getList({
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
      const response: ITableList<IProduct> = await this.apiService.getList({
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
      const response: ITableList<IProduct> = await this.apiService.getList({
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

  editItem(item: IProduct): void {
    this.router.navigate(['/products/edit', item.productId]);
  }

  createItem(): void {
    this.router.navigate(['/products/new']);
  }

  async toggleStatus(item: IProduct): Promise<void> {
    const action = item.active ? 'deactivate' : 'activate';
    const confirmed = confirm(`Are you sure you want to ${action} "${item.name}"?`);
    if (confirmed) {
      this.loading = true;
      try {
        await this.apiService.updateStatus(item.productId, !item.active);
        await this.loadData();
      } catch {
        this.loading = false;
      }
    }
  }
}

