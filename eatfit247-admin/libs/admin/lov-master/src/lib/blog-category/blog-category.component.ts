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
  updatedByUserFormatter
} from '@shared';
import { ITableList } from '@eatfit247-shared-lib';
import { LovMasterApiService } from '../api.service';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';

@Component({
  selector: 'lib-blog-category',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './blog-category.html',
  styleUrl: './blog-category.scss',
})
export class BlogCategory implements OnInit {
  private apiService = inject(LovMasterApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  data: any[] = [];
  totalCount = 0;
  loading = false;
  tableConfig!: ITableConfig<any>;
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
    const columns: ITableColumn<any>[] = [
      { key: 'blogCategoryId', label: 'ID', dataKey: 'blogCategoryId', sortable: true, width: '80px' },
      { key: 'blogCategory', label: 'Blog Category', dataKey: 'blogCategory', sortable: true, searchable: true },
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

    const actions: ITableAction<any>[] = [
      { label: 'Edit', icon: 'edit', color: 'primary', onClick: (row) => this.editItem(row) },
      { label: 'Active', icon: 'check_circle', color: 'primary', visible: (row) => row.active === true, onClick: (row) => this.toggleStatus(row) },
      { label: 'Inactive', icon: 'cancel', color: 'warn', visible: (row) => row.active === false, onClick: (row) => this.toggleStatus(row) },
    ];

    this.tableConfig = {
      columns,
      actions,
      showSearch: true,
      searchPlaceholder: 'Search blog category...',
      showPagination: true,
      pageSize: 10,
      pageSizeOptions: [5, 10, 25, 50],
      showHeader: true,
      emptyMessage: 'No blog category records found',
    };
  }

  private setupSearch(): void {
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged(), switchMap((search) => {
      this.loading = true;
      return this.apiService.getBlogCategoryList({ search, page: 0, limit: this.tableConfig.pageSize || 10 });
    })).subscribe({
      next: (response) => { this.data = response.tableData; this.totalCount = response.count; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  async loadData(): Promise<void> {
    this.loading = true;
    try {
      const response: ITableList<any> = await this.apiService.getBlogCategoryList({ page: 0, limit: this.tableConfig.pageSize || 10, search: this.currentSearch?.trim() || undefined });
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
      const response: ITableList<any> = await this.apiService.getBlogCategoryList({ page: pagination.pageIndex, limit: pagination.pageSize, search: this.currentSearch?.trim() || undefined });
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
      const response: ITableList<any> = await this.apiService.getBlogCategoryList({ page: 0, limit: this.tableConfig.pageSize || 10, sortBy: sort.active, sortOrder: sort.direction, search: this.currentSearch?.trim() || undefined });
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

  editItem(item: any): void {
    this.router.navigate(['/lov-master/blog-category/edit', item.blogCategoryId]);
  }

  createItem(): void {
    this.router.navigate(['/lov-master/blog-category/new']);
  }

  async toggleStatus(item: any): Promise<void> {
    const action = item.active ? 'deactivate' : 'activate';
    const confirmed = confirm(`Are you sure you want to ${action} "${item.blogCategory || item.name}"?`);
    if (confirmed) {
      this.loading = true;
      try {
        await this.apiService.updateBlogCategoryStatus(item.blogCategoryId, !item.active);
        await this.loadData();
      } catch {
        this.loading = false;
      }
    }
  }
}
