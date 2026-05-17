import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BaseListComponent, DataTableComponent, ITableColumn } from '@shared';
import { IUrineOutput } from '@eatfit247-shared-lib';
import { UrineOutputApiService } from '../api.service';

@Component({
  selector: 'lib-urine-output',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './urine-output.html',
  styleUrl: './urine-output.scss',
})
export class UrineOutput extends BaseListComponent<IUrineOutput> {
  protected apiService = inject(UrineOutputApiService);

  protected listConfig = {
    editRoute: '/lov-master/urine-output/edit',
    createRoute: '/lov-master/urine-output/new',
    searchPlaceholder: 'Search urine output...',
    emptyMessage: 'No urine output records found',
  };

  protected buildEntityColumns(): ITableColumn<IUrineOutput>[] {
    return [
      { key: 'urineOutputId', label: 'ID', dataKey: 'urineOutputId', sortable: true, width: '80px' },
      { key: 'urineOutput', label: 'Urine Output', dataKey: 'urineOutput', sortable: true, searchable: true },
      { key: 'image', label: 'Image', dataKey: 'imagePath', type: 'image', isAvatar: true, imageAlt: 'Urine Output Image', sortable: false, width: '80px', align: 'center' },
    ];
  }

  protected getItemId(item: IUrineOutput): number { return item.urineOutputId; }
  protected getItemDisplayName(item: IUrineOutput): string { return item.urineOutput; }
}
