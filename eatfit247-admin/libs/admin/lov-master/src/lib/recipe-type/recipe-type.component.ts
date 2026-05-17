import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BaseListComponent, DataTableComponent, ITableColumn } from '@shared';
import { IRecipeType } from '@eatfit247-shared-lib';
import { RecipeTypeApiService } from '../api.service';

@Component({
  selector: 'lib-recipe-type',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './recipe-type.html',
  styleUrl: './recipe-type.scss',
})
export class RecipeType extends BaseListComponent<IRecipeType> {
  protected apiService = inject(RecipeTypeApiService);

  protected listConfig = {
    editRoute: '/lov-master/recipe-type/edit',
    createRoute: '/lov-master/recipe-type/new',
    searchPlaceholder: 'Search recipe type...',
    emptyMessage: 'No recipe type records found',
  };

  protected buildEntityColumns(): ITableColumn<IRecipeType>[] {
    return [
      { key: 'recipeTypeId', label: 'ID', dataKey: 'recipeTypeId', sortable: true, width: '80px' },
      { key: 'recipeType', label: 'Recipe Type', dataKey: 'recipeType', sortable: true, searchable: true },
    ];
  }

  protected getItemId(item: IRecipeType): number { return item.recipeTypeId; }
  protected getItemDisplayName(item: IRecipeType): string { return item.recipeType; }
}
