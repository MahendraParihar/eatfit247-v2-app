import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BaseListComponent, DataTableComponent, ITableAction, ITableColumn, saveBlobAsFile, downloadErrorMessage } from '@shared';
import { IPocketGuide } from '@eatfit247-shared-lib';
import { PocketGuideApiService } from './api.service';

@Component({
  selector: 'lib-pocket-guide',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule, MatSnackBarModule],
  templateUrl: './pocket-guide.html',
  styleUrl: './pocket-guide.scss',
})
export class PocketGuide extends BaseListComponent<IPocketGuide> {
  protected apiService = inject(PocketGuideApiService);
  private snackBar = inject(MatSnackBar);

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
    ];
  }

  protected override buildExtraActions(): ITableAction<IPocketGuide>[] {
    return [
      {
        label: 'Download', icon: 'download', color: 'primary',
        visible: (row) => row.hasFile,
        onClick: (row) => this.downloadItem(row),
      },
    ];
  }

  async downloadItem(item: IPocketGuide): Promise<void> {
    try {
      const blob = await this.apiService.download(item.pocketGuideId);
      saveBlobAsFile(blob, item.downloadFileName || `${item.pocketGuide}.pdf`);
    } catch (error) {
      const text = downloadErrorMessage(error, 'pocket guide');
      this.snackBar.open(text, 'Close', { duration: 5000 });
    }
  }

  protected getItemId(item: IPocketGuide): number { return item.pocketGuideId; }
  protected getItemDisplayName(item: IPocketGuide): string { return item.pocketGuide; }
}
