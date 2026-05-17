import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { BaseListComponent, DataTableComponent, ITableAction, ITableColumn } from '@shared';
import { IProgram } from '@eatfit247-shared-lib';
import { ProgramsApiService } from './api.service';

@Component({
  selector: 'lib-programs',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataTableComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
  ],
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

  isSpecialProgramFilter: boolean | null = null;

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

  protected override getExtraParams(): Record<string, any> {
    return this.isSpecialProgramFilter === null
      ? {}
      : { isSpecialProgram: this.isSpecialProgramFilter };
  }

  onSpecialProgramFilterChange(): void {
    this.reloadWithFilters();
  }

  protected getItemId(item: IProgram): number { return item.programId; }
  protected getItemDisplayName(item: IProgram): string { return item.program; }

  viewPlans(item: IProgram): void {
    this.router.navigate(['/program-plans'], { queryParams: { programId: item.programId } });
  }
}
