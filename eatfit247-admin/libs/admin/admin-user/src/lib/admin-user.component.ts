import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DataTableComponent, ITableColumn, ITableConfig, ITableAction, createdByUserFormatter, updatedByUserFormatter } from '@shared';
import { ITableList, IAdminUser } from '@eatfit247-shared-lib';
import { AdminUserApiService } from './api.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

@Component({
  selector: 'lib-admin-user',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './admin-user.html',
  styleUrl: './admin-user.scss',
})
export class AdminUser implements OnInit {
  data: IAdminUser[] = [];
  totalCount = 0;
  loading = false;
  tableConfig!: ITableConfig<IAdminUser>;
  private searchSubject = new Subject<string>();

  constructor(
    private apiService: AdminUserApiService,
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
    const columns: ITableColumn<IAdminUser>[] = [
      { key: 'adminId', label: 'ID', dataKey: 'adminId', sortable: true, width: '80px' },
      { key: 'firstName', label: 'First Name', dataKey: 'firstName', sortable: true, searchable: true },
      { key: 'lastName', label: 'Last Name', dataKey: 'lastName', sortable: true, searchable: true },
      { key: 'emailId', label: 'Email', dataKey: 'emailId', sortable: true, searchable: true },
      { key: 'contactNumber', label: 'Contact', dataKey: 'contactNumber', sortable: true },
      { key: 'franchise', label: 'Franchise', dataKey: 'franchise', sortable: false, formatter: (value) => (typeof value === 'string' ? value : value?.companyName || '-') },
      { key: 'adminUserStatusId', label: 'Status', dataKey: 'adminUserStatusId', sortable: true, width: '120px', align: 'center', formatter: (value) => (value === 1 ? 'Active' : 'Inactive') },
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
        dataKey: 'updatedAt',
        type: 'date',
        sortable: true
      },
    ];

    const actions: ITableAction<IAdminUser>[] = [
      { label: 'Edit', icon: 'edit', color: 'primary', onClick: (row) => this.editItem(row) },
      { label: 'View', icon: 'visibility', color: 'primary', onClick: (row) => this.viewItem(row) },
      { label: 'Active', icon: 'check_circle', color: 'primary', visible: (row) => row.adminUserStatusId === 1, onClick: (row) => this.toggleStatus(row) },
      { label: 'Inactive', icon: 'cancel', color: 'warn', visible: (row) => row.adminUserStatusId !== 1, onClick: (row) => this.toggleStatus(row) },
    ];

    this.tableConfig = {
      columns,
      actions,
      showSearch: true,
      searchPlaceholder: 'Search admin users...',
      showPagination: true,
      pageSize: 10,
      pageSizeOptions: [5, 10, 25, 50],
      showHeader: true,
      emptyMessage: 'No admin users found',
    };
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
      const response: ITableList<IAdminUser> = await this.apiService.getList({ page: 0, limit: this.tableConfig.pageSize || 10 });
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
      const response: ITableList<IAdminUser> = await this.apiService.getList({ page: pagination.pageIndex, limit: pagination.pageSize });
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
      const response: ITableList<IAdminUser> = await this.apiService.getList({ page: 0, limit: this.tableConfig.pageSize || 10, sortBy: sort.active, sortOrder: sort.direction });
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

  editItem(item: IAdminUser): void {
    this.router.navigate(['/admin-user/edit', item.adminId]);
  }

  createItem(): void {
    this.router.navigate(['/admin-user/new']);
  }

  viewItem(item: IAdminUser): void {
    console.log('View admin user:', item);
  }

  async toggleStatus(item: IAdminUser): Promise<void> {
    const action = item.adminUserStatusId === 1 ? 'deactivate' : 'activate';
    const confirmed = confirm(`Are you sure you want to ${action} "${item.firstName} ${item.lastName}"?`);
    if (confirmed) {
      this.loading = true;
      try {
        await this.apiService.updateStatus(item.adminId, item.adminUserStatusId === 1 ? false : true);
        await this.loadData();
      } catch {
        this.loading = false;
      }
    }
  }
}
