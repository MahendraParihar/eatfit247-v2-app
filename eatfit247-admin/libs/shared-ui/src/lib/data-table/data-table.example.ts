/**
 * Example usage of DataTableComponent
 * 
 * This file demonstrates how to use the DataTableComponent with various configurations
 */

import { Component, TemplateRef, ViewChild } from '@angular/core';
import { DataTableComponent, TableColumn, TableConfig, TableAction } from '@shared';
import { IBlog, ITableList } from '@eatfit247-shared-lib';
import { BlogsApiService } from 'blogs';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

@Component({
  selector: 'app-blogs-table-example',
  standalone: true,
  imports: [DataTableComponent],
  template: `
    <app-data-table
      [config]="tableConfig"
      [data]="blogs"
      [totalCount]="totalCount"
      [loading]="loading"
      (pageChange)="onPageChange($event)"
      (sortChange)="onSortChange($event)"
      (searchChange)="onSearchChange($event)"
      (rowClick)="onRowClick($event)"
      (selectionChange)="onSelectionChange($event)"
    >
      <!-- Custom cell template for status -->
      <ng-template #statusCell let-row let-value="value">
        <mat-chip [class.active]="value" [class.inactive]="!value">
          {{ value ? 'Active' : 'Inactive' }}
        </mat-chip>
      </ng-template>

      <!-- Custom cell template for image -->
      <ng-template #imageCell let-row let-value="value">
        <img [src]="value" alt="Blog image" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;" />
      </ng-template>
    </app-data-table>
  `,
})
export class BlogsTableExampleComponent {
  @ViewChild('statusCell') statusCellTemplate!: TemplateRef<any>;
  @ViewChild('imageCell') imageCellTemplate!: TemplateRef<any>;

  blogs: IBlog[] = [];
  totalCount = 0;
  loading = false;
  tableConfig!: TableConfig<IBlog>;

  private searchSubject = new Subject<string>();

  constructor(private blogsApi: BlogsApiService) {
    this.initializeTable();
    this.setupSearch();
  }

  ngOnInit(): void {
    this.loadData();
  }

  private initializeTable(): void {
    const columns: TableColumn<IBlog>[] = [
      {
        key: 'blogId',
        label: 'ID',
        dataKey: 'blogId',
        sortable: true,
        width: '80px',
      },
      {
        key: 'title',
        label: 'Title',
        dataKey: 'title',
        sortable: true,
        searchable: true,
      },
      {
        key: 'category',
        label: 'Category',
        dataKey: 'blogCategory.blogCategory',
        sortable: true,
      },
      {
        key: 'author',
        label: 'Author',
        dataKey: 'blogAuthor.firstName',
        formatter: (value, row) => {
          return `${row.blogAuthor?.firstName || ''} ${row.blogAuthor?.lastName || ''}`.trim();
        },
      },
      {
        key: 'status',
        label: 'Status',
        dataKey: 'active',
        sortable: true,
        cellTemplate: this.statusCellTemplate,
        width: '120px',
        align: 'center',
      },
      {
        key: 'image',
        label: 'Image',
        dataKey: 'imageUrl',
        cellTemplate: this.imageCellTemplate,
        width: '80px',
        align: 'center',
      },
      {
        key: 'createdAt',
        label: 'Created',
        dataKey: 'createdAt',
        sortable: true,
        formatter: (value) => {
          return value ? new Date(value).toLocaleDateString() : '';
        },
      },
    ];

    const actions: TableAction<IBlog>[] = [
      {
        label: 'View',
        icon: 'visibility',
        color: 'primary',
        onClick: (row) => this.viewBlog(row),
      },
      {
        label: 'Edit',
        icon: 'edit',
        color: 'primary',
        onClick: (row) => this.editBlog(row),
      },
      {
        label: 'Delete',
        icon: 'delete',
        color: 'warn',
        onClick: (row) => this.deleteBlog(row),
        visible: (row) => row.active === true, // Only show for active blogs
      },
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
      selectable: true,
      onRowClick: (row) => this.viewBlog(row),
      emptyMessage: 'No blogs found',
    };
  }

  private setupSearch(): void {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((search) => {
          this.loading = true;
          return this.blogsApi.getList({ search, page: 0, limit: this.tableConfig.pageSize || 10 });
        })
      )
      .subscribe({
        next: (response) => {
          this.blogs = response.data;
          this.totalCount = response.count;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  loadData(): void {
    this.loading = true;
    this.blogsApi.getList({ page: 0, limit: this.tableConfig.pageSize || 10 }).subscribe({
      next: (response: ITableList<IBlog>) => {
        this.blogs = response.data;
        this.totalCount = response.count;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onPageChange(pagination: any): void {
    this.loading = true;
    this.blogsApi
      .getList({
        page: pagination.pageIndex,
        limit: pagination.pageSize,
      })
      .subscribe({
        next: (response: ITableList<IBlog>) => {
          this.blogs = response.data;
          this.totalCount = response.count;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  onSortChange(sort: any): void {
    this.loading = true;
    this.blogsApi
      .getList({
        page: 0,
        limit: this.tableConfig.pageSize || 10,
        sortBy: sort.active,
        sortOrder: sort.direction,
      })
      .subscribe({
        next: (response: ITableList<IBlog>) => {
          this.blogs = response.data;
          this.totalCount = response.count;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  onSearchChange(search: string): void {
    this.searchSubject.next(search);
  }

  onRowClick(blog: IBlog): void {
    console.log('Row clicked:', blog);
    // Navigate to detail page or open modal
  }

  onSelectionChange(selected: IBlog[]): void {
    console.log('Selected blogs:', selected);
  }

  viewBlog(blog: IBlog): void {
    console.log('View blog:', blog);
    // Navigate to view page
  }

  editBlog(blog: IBlog): void {
    console.log('Edit blog:', blog);
    // Navigate to edit page
  }

  deleteBlog(blog: IBlog): void {
    if (confirm(`Are you sure you want to delete "${blog.title}"?`)) {
      this.blogsApi.updateStatus(blog.blogId, false).subscribe({
        next: () => {
          this.loadData();
        },
      });
    }
  }
}

