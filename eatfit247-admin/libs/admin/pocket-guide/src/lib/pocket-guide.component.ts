import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BaseListComponent, DataTableComponent, ITableAction, ITableColumn } from '@shared';
import { IPocketGuide } from '@eatfit247-shared-lib';
import { PocketGuideApiService } from './api.service';

@Component({
  selector: 'lib-pocket-guide',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './pocket-guide.html',
  styleUrl: './pocket-guide.scss',
})
export class PocketGuide extends BaseListComponent<IPocketGuide> {
  protected apiService = inject(PocketGuideApiService);

  protected listConfig = {
    editRoute: '/pocket-guide/edit',
    createRoute: '/pocket-guide/new',
    searchPlaceholder: 'Search pocket guide...',
    emptyMessage: 'No pocket guide records found',
  };

  protected buildEntityColumns(): ITableColumn<IPocketGuide>[] {
    return [
      { key: 'pocketGuideId', label: 'ID', dataKey: 'pocketGuideId', sortable: true, width: '80px' },
      { key: 'image', label: 'Image', isAvatar: true, dataKey: 'imagePath', sortable: false, type: 'image' },
      { key: 'pocketGuide', label: 'Title', dataKey: 'pocketGuide', sortable: true, searchable: true },
      { key: 'url', label: 'URL', dataKey: 'url', sortable: true },
      { key: 'visitedCount', label: 'Views', dataKey: 'visitedCount', sortable: true, width: '100px', align: 'center' },
      { key: 'shareCount', label: 'Shares', dataKey: 'shareCount', sortable: true, width: '100px', align: 'center' },
      {
        key: 'isVisibleToAll', label: 'Visible', dataKey: 'isVisibleToAll', sortable: true,
        width: '100px', align: 'center',
        formatter: (value) => (value ? 'Yes' : 'No'),
      },
    ];
  }

  protected override buildExtraActions(): ITableAction<IPocketGuide>[] {
    return [
      { label: 'View', icon: 'visibility', color: 'primary', onClick: (row) => this.viewItem(row) },
    ];
  }

  protected getItemId(item: IPocketGuide): number { return item.pocketGuideId; }
  protected getItemDisplayName(item: IPocketGuide): string { return item.pocketGuide; }

  viewItem(item: IPocketGuide): void {
    // View pocket guide - implementation depends on requirements
  }
}
