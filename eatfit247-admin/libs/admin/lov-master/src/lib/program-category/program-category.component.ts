import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BaseListComponent, DataTableComponent, ITableColumn } from '@shared';
import { IProgramCategory } from '@eatfit247-shared-lib';
import { ProgramCategoryApiService } from '../api.service';

@Component({
  selector: 'lib-program-category',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './program-category.html',
  styleUrl: './program-category.scss',
})
export class ProgramCategory extends BaseListComponent<IProgramCategory> {
  protected apiService = inject(ProgramCategoryApiService);

  protected listConfig = {
    editRoute: '/lov-master/program-category/edit',
    createRoute: '/lov-master/program-category/new',
    searchPlaceholder: 'Search program category...',
    emptyMessage: 'No program category records found',
  };

  protected buildEntityColumns(): ITableColumn<IProgramCategory>[] {
    return [
      { key: 'programCategoryId', label: 'ID', dataKey: 'programCategoryId', sortable: true, width: '80px' },
      { key: 'programCategory', label: 'Program Category', dataKey: 'programCategory', sortable: true, searchable: true },
    ];
  }

  protected getItemId(item: IProgramCategory): number { return item.programCategoryId; }
  protected getItemDisplayName(item: IProgramCategory): string { return item.programCategory; }
}
