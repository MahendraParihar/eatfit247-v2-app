import { Component, OnInit, inject } from '@angular/core';
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
  ITableSort,
  updatedByUserFormatter
} from '@shared';
import { DiscountTypeEnum, IPromoCode } from '@eatfit247-shared-lib';
import { PromoCodeApiService } from './api.service';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'lib-promo-code',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule, MatSnackBarModule],
  templateUrl: './promo-code.html',
  styleUrl: './promo-code.scss'
})
export class PromoCode implements OnInit {
  private apiService = inject(PromoCodeApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  data: IPromoCode[] = [];
  totalCount = 0;
  loading = false;
  tableConfig!: ITableConfig<IPromoCode>;
  private searchSubject = new Subject<string>();
  currentSearch = '';
  private currentSort: Pick<ITableSort, 'active' | 'direction'> | null = null;

  constructor() {
    this.setupSearch();
  }

  ngOnInit(): void {
    this.initializeTable();
    this.loadData();
  }

  private initializeTable(): void {
    const columns: ITableColumn<IPromoCode>[] = [
      { key: 'promoCodeId', label: 'ID', dataKey: 'promoCodeId', sortable: true, width: '80px' },
      { key: 'code', label: 'Code', dataKey: 'code', sortable: true, searchable: true },
      {
        key: 'discountType',
        label: 'Discount Type',
        dataKey: 'discountType',
        sortable: true,
        formatter: (value) => value === DiscountTypeEnum.FLAT ? 'Flat' : 'Percent'
      },
      {
        key: 'discountValue',
        label: 'Discount Value',
        dataKey: 'discountValue',
        sortable: true,
        formatter: (value, row) => {
          return row.discountType === DiscountTypeEnum.FLAT
            ? `₹${value}`
            : `${value}%`;
        }
      },
      {
        key: 'maxDiscount',
        label: 'Max Discount',
        dataKey: 'maxDiscount',
        sortable: false,
        formatter: (value) => value ? `₹${value}` : '-'
      },
      {
        key: 'minOrderAmount',
        label: 'Min Order',
        dataKey: 'minOrderAmount',
        sortable: false,
        formatter: (value) => value ? `₹${value}` : '-'
      },
      {
        key: 'usageLimit',
        label: 'Usage Limit',
        dataKey: 'usageLimit',
        sortable: false,
        formatter: (value) => value ? value.toString() : 'Unlimited'
      },
      {
        key: 'usedCount',
        label: 'Used',
        dataKey: 'usedCount',
        sortable: true,
        width: '80px'
      },
      {
        key: 'expiresAt',
        label: 'Expires At',
        dataKey: 'expiresAt',
        type: 'date',
        sortable: true,
        formatter: (value) => value ? new Date(value).toLocaleDateString() : 'Never'
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
      },
    ];
    const actions: ITableAction<IPromoCode>[] = [
      { label: 'Edit', icon: 'edit', color: 'primary', onClick: (row) => this.editItem(row) },
      {
        label: 'Active',
        icon: 'check_circle',
        color: 'primary',
        visible: (row) => row.active,
        onClick: (row) => this.toggleStatus(row)
      },
      {
        label: 'Inactive',
        icon: 'cancel',
        color: 'warn',
        visible: (row) => !row.active,
        onClick: (row) => this.toggleStatus(row)
      }
    ];
    this.tableConfig = {
      columns,
      actions,
      showSearch: true,
      searchPlaceholder: 'Search promo codes...',
      showPagination: true,
      pageSize: 10,
      pageSizeOptions: [5, 10, 25, 50],
      showHeader: true,
      emptyMessage: 'No promo codes found'
    };
  }

  private setupSearch(): void {
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged(), switchMap((search) => {
      this.loading = true;
      return this.apiService.getList(this.getListParams(0, this.tableConfig.pageSize || 10, search));
    })).subscribe({
      next: (result) => {
        this.data = result.tableData;
        this.totalCount = result.count;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  async loadData(page: number = 0, limit: number = 10, search: string = ''): Promise<void> {
    try {
      this.loading = true;
      const result = await this.apiService.getList(this.getListParams(page, limit, search));
      this.data = result.tableData;
      this.totalCount = result.count;
    } catch (error) {
      // Error toast is handled by HttpErrorInterceptor
    } finally {
      this.loading = false;
    }
  }

  onSearch(search: string): void {
    this.currentSearch = search;
    this.searchSubject.next(search);
  }

  onPageChange(page: number, limit: number): void {
    this.loadData(page, limit, this.currentSearch?.trim() || '');
  }

  async onSortChange(sort: ITableSort): Promise<void> {
    if (sort.direction === 'asc' || sort.direction === 'desc') {
      this.currentSort = { active: sort.active, direction: sort.direction };
    } else {
      this.currentSort = null;
    }
    await this.loadData(0, this.tableConfig.pageSize || 10, this.currentSearch?.trim() || '');
  }

  private getListParams(
    page: number,
    limit: number,
    search: string,
  ): { page: number; limit: number; search?: string; sortBy?: string; sortOrder?: string } {
    const params: { page: number; limit: number; search?: string; sortBy?: string; sortOrder?: string } = {
      page,
      limit,
    };
    const trimmed = search?.trim();
    if (trimmed) {
      params.search = trimmed;
    }
    const sort = this.currentSort;
    if (sort && (sort.direction === 'asc' || sort.direction === 'desc')) {
      params.sortBy = sort.active;
      params.sortOrder = sort.direction;
    }
    return params;
  }

  editItem(row: IPromoCode): void {
    this.router.navigate(['edit', row.promoCodeId], { relativeTo: this.route });
  }

  async toggleStatus(row: IPromoCode): Promise<void> {
    try {
      await this.apiService.updateStatus(row.promoCodeId, !row.active);
      await this.loadData(0, this.tableConfig.pageSize || 10, this.currentSearch?.trim() || '');
    } catch (error) {
      // Error toast is handled by HttpErrorInterceptor
    }
  }

  navigateToCreate(): void {
    this.router.navigate(['new'], { relativeTo: this.route });
  }
}

