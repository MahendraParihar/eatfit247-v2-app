import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BaseListComponent, DataTableComponent, ITableAction, ITableColumn } from '@shared';
import { IGoogleReview } from '@eatfit247-shared-lib';
import { GoogleReviewsApiService } from './api.service';

@Component({
  selector: 'lib-google-reviews',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './google-reviews.html',
  styleUrl: './google-reviews.scss',
})
export class GoogleReviews extends BaseListComponent<IGoogleReview> {
  protected apiService = inject(GoogleReviewsApiService);

  protected listConfig = {
    editRoute: '/google-reviews/edit',
    createRoute: '/google-reviews/new',
    searchPlaceholder: 'Search by reviewer name...',
    emptyMessage: 'No reviews found',
  };

  protected buildEntityColumns(): ITableColumn<IGoogleReview>[] {
    return [
      { key: 'googleReviewId', label: 'ID', dataKey: 'googleReviewId', sortable: true, width: '80px' },
      { key: 'entityType', label: 'Entity', dataKey: 'entityType', sortable: true, width: '130px' },
      { key: 'entityId', label: 'Entity ID', dataKey: 'entityId', sortable: false, width: '90px' },
      { key: 'reviewerName', label: 'Reviewer', dataKey: 'reviewerName', sortable: true, searchable: true },
      { key: 'rating', label: 'Rating', dataKey: 'rating', sortable: true, width: '90px', align: 'center' },
      { key: 'source', label: 'Source', dataKey: 'source', sortable: true, width: '100px' },
      { key: 'isPublished', label: 'Published', dataKey: 'isPublished', sortable: true, width: '100px', type: 'boolean' },
      { key: 'reviewDate', label: 'Review Date', dataKey: 'reviewDate', sortable: true, type: 'date', width: '120px' },
    ];
  }

  protected override buildExtraActions(): ITableAction<IGoogleReview>[] {
    return [];
  }

  protected getItemId(item: IGoogleReview): number {
    return item.googleReviewId;
  }

  protected getItemDisplayName(item: IGoogleReview): string {
    return item.reviewerName;
  }
}
