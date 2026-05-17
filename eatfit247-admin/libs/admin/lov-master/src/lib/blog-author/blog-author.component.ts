import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BaseListComponent, DataTableComponent, ITableColumn } from '@shared';
import { IBlogAuthor } from '@eatfit247-shared-lib';
import { BlogAuthorApiService } from '../api.service';

@Component({
  selector: 'lib-blog-author',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './blog-author.html',
  styleUrl: './blog-author.scss',
})
export class BlogAuthor extends BaseListComponent<IBlogAuthor> {
  protected apiService = inject(BlogAuthorApiService);

  protected listConfig = {
    editRoute: '/lov-master/blog-author/edit',
    createRoute: '/lov-master/blog-author/new',
    searchPlaceholder: 'Search blog author...',
    emptyMessage: 'No blog author records found',
  };

  protected buildEntityColumns(): ITableColumn<IBlogAuthor>[] {
    return [
      { key: 'blogAuthorId', label: 'ID', dataKey: 'blogAuthorId', sortable: true, width: '80px' },
      { key: 'image', label: 'Image', dataKey: 'imagePath', type: 'image', isAvatar: true, imageAlt: 'Blog Author Image', sortable: false, width: '80px', align: 'center' },
      { key: 'firstName', label: 'Blog Author', dataKey: 'firstName', sortable: true, searchable: true },
    ];
  }

  protected getItemId(item: IBlogAuthor): number { return item.blogAuthorId; }
  protected getItemDisplayName(item: IBlogAuthor): string { return item.firstName; }
}
