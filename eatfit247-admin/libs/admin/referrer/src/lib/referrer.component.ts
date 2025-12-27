import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  DataTableComponent,
  ITableColumn,
  ITableConfig,
  ITableAction,
  createdByUserFormatter,
  updatedByUserFormatter
} from '@shared';
import { ITableList, IReferrer } from '@eatfit247-shared-lib';
import { ReferrerApiService } from './api.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

@Component({
  selector: 'lib-referrer',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './referrer.html',
  styleUrl: './referrer.scss'
})
export class Referrer implements OnInit {
  data: IReferrer[] = [];
  totalCount = 0;
  loading = false;
  tableConfig!: ITableConfig<IReferrer>;
  private searchSubject = new Subject<string>();

  constructor(
    private apiService: ReferrerApiService,
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
    const columns: ITableColumn<IReferrer>[] = [
      { key: 'referrerId', label: 'ID', dataKey: 'referrerId', sortable: true, width: '80px' },
      {
        key: 'logo',
        label: 'Logo',
        dataKey: 'logo',
        sortable: false,
        searchable: false,
        isAvatar: true,
        type: 'image',
        width: '80px'
      },
      { key: 'name', label: 'Name', dataKey: 'name', sortable: true, searchable: true },
      {
        key: 'companyName',
        label: 'Company',
        dataKey: 'companyName',
        sortable: false
      },
      { key: 'emailId', label: 'Email', dataKey: 'emailId', sortable: false },
      { key: 'contactNumber', label: 'Contact', dataKey: 'contactNumber', sortable: false },
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
    const actions: ITableAction<IReferrer>[] = [
      { label: 'Edit', icon: 'edit', color: 'primary', onClick: (row) => this.editItem(row) },
      { label: 'View', icon: 'visibility', color: 'primary', onClick: (row) => this.viewItem(row) },
      {
        label: 'Active',
        icon: 'check_circle',
        color: 'primary',
        visible: (row) => row.active === true,
        onClick: (row) => this.toggleStatus(row)
      },
      {
        label: 'Inactive',
        icon: 'cancel',
        color: 'warn',
        visible: (row) => row.active === false,
        onClick: (row) => this.toggleStatus(row)
      }
    ];
    this.tableConfig = {
      columns,
      actions,
      showSearch: true,
      searchPlaceholder: 'Search referrers...',
      showPagination: true,
      pageSize: 10,
      pageSizeOptions: [5, 10, 25, 50],
      showHeader: true,
      emptyMessage: 'No referrers found'
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
      const response: ITableList<IReferrer> = await this.apiService.getList({
        page: 0,
        limit: this.tableConfig.pageSize || 10
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
      const response: ITableList<IReferrer> = await this.apiService.getList({
        page: pagination.pageIndex,
        limit: pagination.pageSize
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
      const response: ITableList<IReferrer> = await this.apiService.getList({
        page: 0,
        limit: this.tableConfig.pageSize || 10,
        sortBy: sort.active,
        sortOrder: sort.direction
      });
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

  editItem(item: IReferrer): void {
    this.router.navigate(['/referrer/edit', item.referrerId]);
  }

  createItem(): void {
    this.router.navigate(['/referrer/new']);
  }

  viewItem(item: IReferrer): void {
    console.log('View referrer:', item);
  }

  async toggleStatus(item: IReferrer): Promise<void> {
    const action = item.active ? 'deactivate' : 'activate';
    const confirmed = confirm(`Are you sure you want to ${action} "${item.name}"?`);
    if (confirmed) {
      this.loading = true;
      try {
        await this.apiService.updateStatus(item.referrerId, !item.active);
        await this.loadData();
      } catch {
        this.loading = false;
      }
    }
  }
}
