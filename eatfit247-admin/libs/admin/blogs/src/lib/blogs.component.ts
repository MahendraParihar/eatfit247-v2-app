import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BaseListComponent, DataTableComponent, ITableAction, ITableColumn } from '@shared';
import { IBlog } from '@eatfit247-shared-lib';
import { BlogsApiService } from './api.service';

@Component({
  selector: 'lib-blogs',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule, MatSnackBarModule],
  templateUrl: './blogs.html',
  styleUrl: './blogs.scss',
})
export class Blogs extends BaseListComponent<IBlog> {
  protected apiService = inject(BlogsApiService);
  private snackBar = inject(MatSnackBar);

  protected listConfig = {
    editRoute: '/blogs/edit',
    createRoute: '/blogs/new',
    searchPlaceholder: 'Search blogs...',
    emptyMessage: 'No blogs found',
  };

  protected buildEntityColumns(): ITableColumn<IBlog>[] {
    return [
      { key: 'blogId', label: 'ID', dataKey: 'blogId', sortable: true, width: '80px' },
      { key: 'image', label: 'Image', isAvatar: true, dataKey: 'imagePath', sortable: false, type: 'image' },
      { key: 'title', label: 'Title', dataKey: 'title', sortable: true, searchable: true },
      { key: 'blogCategory', label: 'Category', dataKey: 'blogCategory', sortField: 'blogCategoryId', sortable: true },
      {
        key: 'blogAuthor', label: 'Author', dataKey: 'blogAuthor',
        formatter: (value, row) => `${row.blogAuthor || ''}`.trim(),
      },
    ];
  }

  protected override buildExtraActions(): ITableAction<IBlog>[] {
    return [
      { label: 'View', icon: 'visibility', color: 'primary', onClick: (row) => this.viewItem(row) },
    ];
  }

  protected getItemId(item: IBlog): number { return item.blogId; }
  protected getItemDisplayName(item: IBlog): string { return item.title; }

  viewItem(item: IBlog): void {
    // View functionality can be implemented here if needed
  }

  override async toggleStatus(item: IBlog): Promise<void> {
    const action = item.active ? 'deactivate' : 'activate';
    const confirmed = confirm(`Are you sure you want to ${action} "${item.title}"?`);
    if (confirmed) {
      this.loading = true;
      try {
        await this.apiService.updateStatus(item.blogId, !item.active);
        this.snackBar.open(
          `Blog ${item.active ? 'deactivated' : 'activated'} successfully`,
          'Close',
          { duration: 3000 }
        );
        await this.loadData();
        this.loading = false;
      } catch {
        this.loading = false;
      }
    }
  }
}
