import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BaseListComponent, DataTableComponent, ITableAction, ITableColumn } from '@shared';
import { ISuccessStory } from '@eatfit247-shared-lib';
import { SuccessStoriesApiService } from './api.service';

@Component({
  selector: 'lib-success-stories',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './success-stories.html',
  styleUrl: './success-stories.scss',
})
export class SuccessStories extends BaseListComponent<ISuccessStory> {
  protected apiService = inject(SuccessStoriesApiService);

  protected listConfig = {
    editRoute: '/success-stories/edit',
    createRoute: '/success-stories/new',
    searchPlaceholder: 'Search success stories...',
    emptyMessage: 'No success stories found',
  };

  protected buildEntityColumns(): ITableColumn<ISuccessStory>[] {
    return [
      { key: 'successStoryId', label: 'ID', dataKey: 'successStoryId', sortable: true, width: '80px' },
      { key: 'name', label: 'Name', dataKey: 'name', sortable: true, searchable: true },
      { key: 'title', label: 'Title', dataKey: 'title', sortable: true, searchable: true },
      { key: 'date', label: 'Date', dataKey: 'date', sortable: true, type: 'date', width: '120px' },
      { key: 'mediaType', label: 'Media', dataKey: 'mediaType', sortable: true, width: '100px' },
      { key: 'image', label: 'Image', dataKey: 'imagePath', sortable: false, width: '100px', align: 'center', isAvatar: true, type: 'image' },
    ];
  }

  protected override buildExtraActions(): ITableAction<ISuccessStory>[] {
    return [
      { label: 'View', icon: 'visibility', color: 'primary', onClick: (row) => this.viewItem(row) },
    ];
  }

  protected getItemId(item: ISuccessStory): number { return item.successStoryId; }
  protected getItemDisplayName(item: ISuccessStory): string { return item.name; }

  viewItem(item: ISuccessStory): void {
    // View success story - implementation depends on requirements
  }
}
