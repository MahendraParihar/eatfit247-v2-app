import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BaseListComponent, DataTableComponent, ITableColumn } from '@shared';
import { IBlogComment } from '@eatfit247-shared-lib';
import { BlogCommentsApiService } from '../api.service';

@Component({
  selector: 'lib-blog-comments',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './blog-comments.html',
  styleUrl: './blog-comments.scss',
})
export class BlogComments extends BaseListComponent<IBlogComment> {
  protected apiService = inject(BlogCommentsApiService);

  protected listConfig = {
    editRoute: '/lov-master/blog-comments/edit',
    createRoute: '/lov-master/blog-comments/new',
    searchPlaceholder: 'Search blog comments...',
    emptyMessage: 'No blog comments records found',
  };

  protected buildEntityColumns(): ITableColumn<IBlogComment>[] {
    return [
      { key: 'blogCommentId', label: 'ID', dataKey: 'blogCommentId', sortable: true, width: '80px' },
      { key: 'comment', label: 'Blog Comments', dataKey: 'comment', sortable: true, searchable: true },
    ];
  }

  protected getItemId(item: IBlogComment): number { return item.blogCommentId; }
  protected getItemDisplayName(item: IBlogComment): string { return item.comment; }
}
