import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  DataTableComponent, createdByUserFormatter, updatedByUserFormatter,
  ITableColumn, ITableConfig, ITableAction
} from '@shared';
import { ITableList, IBlog } from '@eatfit247-shared-lib';
import { BlogsApiService } from './api.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

@Component({
  selector: 'lib-blogs',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './blogs.html',
  styleUrl: './blogs.scss'
})
export class Blogs implements OnInit {
  data: IBlog[] = [];
  totalCount = 0;
  loading = false;
  tableConfig!: ITableConfig<IBlog>;
  private searchSubject = new Subject<string>();

  constructor(
    private apiService: BlogsApiService,
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
    const columns: ITableColumn<IBlog>[] = [
      {
        key: 'blogId',
        label: 'ID',
        dataKey: 'blogId',
        sortable: true,
        width: '80px',
      },
      {
        key: 'image',
        label: 'Image',
        isAvatar: true,
        dataKey: 'imagePath',
        sortable: false,
        type: 'image',
      },
      {
        key: 'title',
        label: 'Title',
        dataKey: 'title',
        sortable: true,
        searchable: true,
      },
      {
        key: 'blogCategory',
        label: 'Category',
        dataKey: 'blogCategory',
        sortable: true,
      },
      {
        key: 'blogAuthor',
        label: 'Author',
        dataKey: 'blogAuthor',
        formatter: (value, row) => `${row.blogAuthor || ''}`.trim(),
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
    const actions: ITableAction<IBlog>[] = [
      { label: 'Edit', icon: 'edit', color: 'primary', onClick: (row) => this.editItem(row) },
      { label: 'View', icon: 'visibility', color: 'primary', onClick: (row) => this.viewItem(row) },
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
      searchPlaceholder: 'Search blogs...',
      showPagination: true,
      pageSize: 10,
      pageSizeOptions: [5, 10, 25, 50],
      showHeader: true,
      emptyMessage: 'No blogs found'
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
      const response: ITableList<IBlog> = await this.apiService.getList({
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
      const response: ITableList<IBlog> = await this.apiService.getList({
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
      const response: ITableList<IBlog> = await this.apiService.getList({
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

  editItem(item: IBlog): void {
    this.router.navigate(['/blogs/edit', item.blogId]);
  }

  createItem(): void {
    this.router.navigate(['/blogs/new']);
  }

  viewItem(item: IBlog): void {
    console.log('View blog:', item);
  }

  async toggleStatus(item: IBlog): Promise<void> {
    const action = item.active ? 'deactivate' : 'activate';
    const confirmed = confirm(`Are you sure you want to ${action} "${item.title}"?`);
    if (confirmed) {
      this.loading = true;
      try {
        await this.apiService.updateStatus(item.blogId, !item.active);
        await this.loadData();
        this.loading = false;
      } catch {
        this.loading = false;
      }
    }
  }
}
