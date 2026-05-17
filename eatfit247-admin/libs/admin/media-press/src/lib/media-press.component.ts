import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BaseListComponent, DataTableComponent, ITableAction, ITableColumn } from '@shared';
import { IPressMedia } from '@eatfit247-shared-lib';
import { PressMediaApiService } from './api.service';

@Component({
  selector: 'lib-media-press',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule, MatSnackBarModule],
  templateUrl: './media-press.html',
  styleUrl: './media-press.scss',
})
export class MediaPress extends BaseListComponent<IPressMedia> {
  protected apiService = inject(PressMediaApiService);
  private snackBar = inject(MatSnackBar);

  protected listConfig = {
    editRoute: '/media-press/edit',
    createRoute: '/media-press/new',
    searchPlaceholder: 'Search media & press...',
    emptyMessage: 'No media & press records found',
  };

  protected buildEntityColumns(): ITableColumn<IPressMedia>[] {
    return [
      { key: 'pressMediaId', label: 'ID', dataKey: 'pressMediaId', sortable: true, width: '80px' },
      { key: 'title', label: 'Title', dataKey: 'title', sortable: true, searchable: true },
      {
        key: 'type', label: 'Type', dataKey: 'type', sortable: true, width: '100px', align: 'center',
        formatter: (value) => value ? value.charAt(0).toUpperCase() + value.slice(1) : '-',
      },
      { key: 'image', label: 'Image', dataKey: 'imagePath', sortable: false, width: '100px', align: 'center', isAvatar: true, type: 'image' },
    ];
  }

  protected override buildExtraActions(): ITableAction<IPressMedia>[] {
    return [
      { label: 'View', icon: 'visibility', color: 'primary', onClick: (row) => this.viewItem(row) },
    ];
  }

  protected getItemId(item: IPressMedia): number { return item.pressMediaId; }
  protected getItemDisplayName(item: IPressMedia): string { return item.title ?? ''; }

  viewItem(item: IPressMedia): void {
    // View functionality can be implemented here if needed
  }

  override async toggleStatus(item: IPressMedia): Promise<void> {
    const action = item.active ? 'deactivate' : 'activate';
    const confirmed = confirm(`Are you sure you want to ${action} "${item.title}"?`);
    if (confirmed) {
      this.loading = true;
      try {
        await this.apiService.updateStatus(item.pressMediaId, !item.active);
        this.snackBar.open(
          `Media & press ${item.active ? 'deactivated' : 'activated'} successfully`,
          'Close',
          { duration: 3000 }
        );
        await this.loadData();
      } catch {
        this.loading = false;
      }
    }
  }
}
