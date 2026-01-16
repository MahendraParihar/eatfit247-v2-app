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
import { IAddressType, ITableList } from '@eatfit247-shared-lib';
import { LovMasterApiService } from '../api.service';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';

@Component({
  selector: 'lib-address-type',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './address-type.html',
  styleUrl: './address-type.scss',
})
export class AddressType implements OnInit {
  data: IAddressType[] = [];
  totalCount = 0;
  loading = false;
  tableConfig!: ITableConfig<IAddressType>;
  private searchSubject = new Subject<string>();

  constructor(
    private apiService: LovMasterApiService,
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
    const columns: ITableColumn<IAddressType>[] = [
      { key: 'addressTypeId', label: 'ID', dataKey: 'addressTypeId', sortable: true, width: '80px' },
      { key: 'addressType', label: 'Address Type', dataKey: 'addressType', sortable: true, searchable: true },
      { key: 'active', label: 'Status', dataKey: 'active', sortable: true, width: '120px', align: 'center', formatter: (value) => (value ? 'Active' : 'Inactive') },
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
        type: 'date',
        dataKey: 'updatedAt',
        sortable: true
      },
    ];

    const actions: ITableAction<IAddressType>[] = [
      { label: 'Edit', icon: 'edit', color: 'primary', onClick: (row) => this.editItem(row) },
      { label: 'Active', icon: 'check_circle', color: 'primary', visible: (row) => row.active === true, onClick: (row) => this.toggleStatus(row) },
      { label: 'Inactive', icon: 'cancel', color: 'warn', visible: (row) => row.active === false, onClick: (row) => this.toggleStatus(row) },
    ];

    this.tableConfig = {
      columns,
      actions,
      showSearch: true,
      searchPlaceholder: 'Search address type...',
      showPagination: true,
      pageSize: 10,
      pageSizeOptions: [5, 10, 25, 50],
      showHeader: true,
      emptyMessage: 'No address type records found',
    };
  }

  private setupSearch(): void {
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged(), switchMap((search) => {
      this.loading = true;
      return this.apiService.getAddressTypeList({ search, page: 0, limit: this.tableConfig.pageSize || 10 });
    })).subscribe({
      next: (response) => { this.data = response.tableData; this.totalCount = response.count; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  async loadData(): Promise<void> {
    this.loading = true;
    try {
      const response: ITableList<IAddressType> = await this.apiService.getAddressTypeList({ page: 0, limit: this.tableConfig.pageSize || 10 });
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
      const response: ITableList<IAddressType> = await this.apiService.getAddressTypeList({ page: pagination.pageIndex, limit: pagination.pageSize });
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
      const response: ITableList<IAddressType> = await this.apiService.getAddressTypeList({ page: 0, limit: this.tableConfig.pageSize || 10, sortBy: sort.active, sortOrder: sort.direction });
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

  editItem(item: IAddressType): void {
    this.router.navigate(['/lov-master/address-type/edit', item.addressTypeId]);
  }

  createItem(): void {
    this.router.navigate(['/lov-master/address-type/new']);
  }

  async toggleStatus(item: IAddressType): Promise<void> {
    const action = item.active ? 'deactivate' : 'activate';
    const confirmed = confirm(`Are you sure you want to ${action} "${item.addressType}"?`);
    if (confirmed) {
      this.loading = true;
      try {
        await this.apiService.updateAddressTypeStatus(item.addressTypeId, !item.active);
        await this.loadData();
      } catch {
        this.loading = false;
      }
    }
  }
}
