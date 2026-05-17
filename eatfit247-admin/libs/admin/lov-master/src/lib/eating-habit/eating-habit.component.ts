import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BaseListComponent, DataTableComponent, ITableColumn } from '@shared';
import { IEatingHabit } from '@eatfit247-shared-lib';
import { EatingHabitApiService } from '../api.service';

@Component({
  selector: 'lib-eating-habit',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './eating-habit.html',
  styleUrl: './eating-habit.scss',
})
export class EatingHabit extends BaseListComponent<IEatingHabit> {
  protected apiService = inject(EatingHabitApiService);

  protected listConfig = {
    editRoute: '/lov-master/eating-habit/edit',
    createRoute: '/lov-master/eating-habit/new',
    searchPlaceholder: 'Search eating habit...',
    emptyMessage: 'No eating habit records found',
  };

  protected buildEntityColumns(): ITableColumn<IEatingHabit>[] {
    return [
      { key: 'eatingHabitId', label: 'ID', dataKey: 'eatingHabitId', sortable: true, width: '80px' },
      { key: 'eatingHabit', label: 'Eating Habit', dataKey: 'eatingHabit', sortable: true, searchable: true },
      { key: 'image', label: 'Image', dataKey: 'imagePath', type: 'image', isAvatar: true, imageAlt: 'Eating Habit Image', sortable: false, width: '80px', align: 'center' },
    ];
  }

  protected getItemId(item: IEatingHabit): number { return item.eatingHabitId; }
  protected getItemDisplayName(item: IEatingHabit): string { return item.eatingHabit; }
}
