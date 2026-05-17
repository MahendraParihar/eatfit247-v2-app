import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BaseListComponent, DataTableComponent, ITableColumn } from '@shared';
import { IRecipeCategory } from '@eatfit247-shared-lib';
import { RecipeCategoryApiService } from '../api.service';

@Component({
  selector: 'lib-recipe-category',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './recipe-category.html',
  styleUrl: './recipe-category.scss',
})
export class RecipeCategory extends BaseListComponent<IRecipeCategory> {
  protected apiService = inject(RecipeCategoryApiService);

  protected listConfig = {
    editRoute: '/lov-master/recipe-category/edit',
    createRoute: '/lov-master/recipe-category/new',
    searchPlaceholder: 'Search recipe category...',
    emptyMessage: 'No recipe category records found',
  };

  protected buildEntityColumns(): ITableColumn<IRecipeCategory>[] {
    return [
      { key: 'recipeCategoryId', label: 'ID', dataKey: 'recipeCategoryId', sortable: true, width: '80px' },
      { key: 'recipeCategory', label: 'Recipe Category', dataKey: 'recipeCategory', sortable: true, searchable: true },
    ];
  }

  protected getItemId(item: IRecipeCategory): number { return item.recipeCategoryId; }
  protected getItemDisplayName(item: IRecipeCategory): string { return item.recipeCategory; }
}
