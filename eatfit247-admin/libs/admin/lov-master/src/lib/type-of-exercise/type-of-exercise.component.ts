import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BaseListComponent, DataTableComponent, ITableColumn } from '@shared';
import { ITypeOfExercise } from '@eatfit247-shared-lib';
import { TypeOfExerciseApiService } from '../api.service';

@Component({
  selector: 'lib-type-of-exercise',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './type-of-exercise.html',
  styleUrl: './type-of-exercise.scss',
})
export class TypeOfExercise extends BaseListComponent<ITypeOfExercise> {
  protected apiService = inject(TypeOfExerciseApiService);

  protected listConfig = {
    editRoute: '/lov-master/type-of-exercise/edit',
    createRoute: '/lov-master/type-of-exercise/new',
    searchPlaceholder: 'Search type of exercise...',
    emptyMessage: 'No type of exercise records found',
  };

  protected buildEntityColumns(): ITableColumn<ITypeOfExercise>[] {
    return [
      { key: 'typeOfExerciseId', label: 'ID', dataKey: 'typeOfExerciseId', sortable: true, width: '80px' },
      { key: 'typeOfExercise', label: 'Type of Exercise', dataKey: 'typeOfExercise', sortable: true, searchable: true },
      { key: 'image', label: 'Image', dataKey: 'imagePath', type: 'image', isAvatar: true, imageAlt: 'Type of Exercise Image', sortable: false, width: '80px', align: 'center' },
    ];
  }

  protected getItemId(item: ITypeOfExercise): number { return item.typeOfExerciseId; }
  protected getItemDisplayName(item: ITypeOfExercise): string { return item.typeOfExercise; }
}
