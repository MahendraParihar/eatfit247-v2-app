import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BaseListComponent, DataTableComponent, ITableColumn } from '@shared';
import { IBlogCategory } from '@eatfit247-shared-lib';
import { BlogCategoryApiService } from '../api.service';

@Component({
  selector: 'lib-blog-category',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './blog-category.html',
  styleUrl: './blog-category.scss',
})
export class BlogCategory extends BaseListComponent<IBlogCategory> {
  protected apiService = inject(BlogCategoryApiService);

  protected listConfig = {
    editRoute: '/lov-master/blog-category/edit',
    createRoute: '/lov-master/blog-category/new',
    searchPlaceholder: 'Search blog category...',
    emptyMessage: 'No blog category records found',
  };

  protected buildEntityColumns(): ITableColumn<IBlogCategory>[] {
    return [
      { key: 'blogCategoryId', label: 'ID', dataKey: 'blogCategoryId', sortable: true, width: '80px' },
      { key: 'blogCategory', label: 'Blog Category', dataKey: 'blogCategory', sortable: true, searchable: true },
    ];
  }

  protected getItemId(item: IBlogCategory): number { return item.blogCategoryId; }
  protected getItemDisplayName(item: IBlogCategory): string { return item.blogCategory; }
}
