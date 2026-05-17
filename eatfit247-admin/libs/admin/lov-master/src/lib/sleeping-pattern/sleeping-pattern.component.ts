import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BaseListComponent, DataTableComponent, ITableColumn } from '@shared';
import { ISleepingPattern } from '@eatfit247-shared-lib';
import { SleepingPatternApiService } from '../api.service';

@Component({
  selector: 'lib-sleeping-pattern',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './sleeping-pattern.html',
  styleUrl: './sleeping-pattern.scss',
})
export class SleepingPattern extends BaseListComponent<ISleepingPattern> {
  protected apiService = inject(SleepingPatternApiService);

  protected listConfig = {
    editRoute: '/lov-master/sleeping-pattern/edit',
    createRoute: '/lov-master/sleeping-pattern/new',
    searchPlaceholder: 'Search sleeping pattern...',
    emptyMessage: 'No sleeping pattern records found',
  };

  protected buildEntityColumns(): ITableColumn<ISleepingPattern>[] {
    return [
      { key: 'sleepingPatternId', label: 'ID', dataKey: 'sleepingPatternId', sortable: true, width: '80px' },
      { key: 'sleepingPattern', label: 'Sleeping Pattern', dataKey: 'sleepingPattern', sortable: true, searchable: true },
      { key: 'image', label: 'Image', dataKey: 'imagePath', type: 'image', isAvatar: true, imageAlt: 'Sleeping Pattern Image', sortable: false, width: '80px', align: 'center' },
    ];
  }

  protected getItemId(item: ISleepingPattern): number { return item.sleepingPatternId; }
  protected getItemDisplayName(item: ISleepingPattern): string { return item.sleepingPattern; }
}
