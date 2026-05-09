import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BaseListComponent, DataTableComponent, ITableAction, ITableColumn } from '@shared';
import { IProgram } from '@eatfit247-shared-lib';
import { ProgramsApiService } from './api.service';

@Component({
  selector: 'lib-programs',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './programs.html',
  styleUrl: './programs.scss'
})
export class Programs extends BaseListComponent<IProgram> {
  protected apiService = inject(ProgramsApiService);

  protected listConfig = {
    editRoute: '/programs/edit',
    createRoute: '/programs/new',
    searchPlaceholder: 'Search programs...',
    emptyMessage: 'No programs found',
  };

  protected buildEntityColumns(): ITableColumn<IProgram>[] {
    return [
      { key: 'programId', label: 'ID', dataKey: 'programId', sortable: true, width: '80px' },
      {
        key: 'image',
        label: 'Image',
        isAvatar: true,
        dataKey: 'imagePath',
        sortable: false,
        type: 'image',
      },
      { key: 'program', label: 'Program', dataKey: 'program', sortable: true, searchable: true },
      { key: 'programCategory', label: 'Category', dataKey: 'programCategory', sortable: false },
      {
        key: 'isSpecialProgram',
        label: 'Special',
        dataKey: 'isSpecialProgram',
        sortable: true,
        width: '100px',
        align: 'center',
        formatter: (value) => (value ? 'Yes' : 'No'),
      },
    ];
  }

  protected override buildExtraActions(): ITableAction<IProgram>[] {
    return [
      { label: 'View Plans', icon: 'visibility', color: 'primary', onClick: (row) => this.viewPlans(row) },
    ];
  }

  protected getItemId(item: IProgram): number { return item.programId; }
  protected getItemDisplayName(item: IProgram): string { return item.program; }

  viewPlans(item: IProgram): void {
    this.router.navigate(['/program-plans'], { queryParams: { programId: item.programId } });
  }
}
