import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BaseListComponent, DataTableComponent, ITableColumn } from '@shared';
import { IBloodSugar } from '@eatfit247-shared-lib';
import { BloodSugarApiService } from '../api.service';

@Component({
  selector: 'lib-blood-sugar',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './blood-sugar.html',
  styleUrl: './blood-sugar.scss',
})
export class BloodSugar extends BaseListComponent<IBloodSugar> {
  protected apiService = inject(BloodSugarApiService);

  protected listConfig = {
    editRoute: '/lov-master/blood-sugar/edit',
    createRoute: '/lov-master/blood-sugar/new',
    searchPlaceholder: 'Search blood sugar...',
    emptyMessage: 'No blood sugar records found',
  };

  protected buildEntityColumns(): ITableColumn<IBloodSugar>[] {
    return [
      { key: 'bloodSugarId', label: 'ID', dataKey: 'bloodSugarId', sortable: true, width: '80px' },
      { key: 'bloodSugar', label: 'Blood Sugar', dataKey: 'bloodSugar', sortable: true, searchable: true },
      { key: 'image', label: 'Image', dataKey: 'imagePath', type: 'image', isAvatar: true, imageAlt: 'Blood Sugar Image', sortable: false, width: '80px', align: 'center' },
    ];
  }

  protected getItemId(item: IBloodSugar): number { return item.bloodSugarId; }
  protected getItemDisplayName(item: IBloodSugar): string { return item.bloodSugar; }
}
