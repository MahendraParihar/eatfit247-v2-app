import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BaseListComponent, DataTableComponent, ITableColumn } from '@shared';
import { IRecipeCuisine } from '@eatfit247-shared-lib';
import { RecipeCuisineApiService } from '../api.service';

@Component({
  selector: 'lib-recipe-cuisine',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './recipe-cuisine.html',
  styleUrl: './recipe-cuisine.scss',
})
export class RecipeCuisine extends BaseListComponent<IRecipeCuisine> {
  protected apiService = inject(RecipeCuisineApiService);

  protected listConfig = {
    editRoute: '/lov-master/recipe-cuisine/edit',
    createRoute: '/lov-master/recipe-cuisine/new',
    searchPlaceholder: 'Search recipe cuisine...',
    emptyMessage: 'No recipe cuisine records found',
  };

  protected buildEntityColumns(): ITableColumn<IRecipeCuisine>[] {
    return [
      { key: 'recipeCuisineId', label: 'ID', dataKey: 'recipeCuisineId', sortable: true, width: '80px' },
      { key: 'recipeCuisine', label: 'Recipe Cuisine', dataKey: 'recipeCuisine', sortable: true, searchable: true },
    ];
  }

  protected getItemId(item: IRecipeCuisine): number { return item.recipeCuisineId; }
  protected getItemDisplayName(item: IRecipeCuisine): string { return item.recipeCuisine; }
}
