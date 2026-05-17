import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BaseListComponent, DataTableComponent, ITableColumn } from '@shared';
import { ILegalPageList } from '@eatfit247-shared-lib';
import { LegalPagesApiService } from './api.service';

@Component({
  selector: 'lib-legal-pages',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './legal-pages.html',
  styleUrl: './legal-pages.scss'
})
export class LegalPages extends BaseListComponent<ILegalPageList> {
  protected apiService = inject(LegalPagesApiService);

  protected listConfig = {
    editRoute: '/legal-pages/edit',
    createRoute: '/legal-pages/new',
    searchPlaceholder: 'Search legal pages...',
    emptyMessage: 'No legal pages found',
  };

  protected buildEntityColumns(): ITableColumn<ILegalPageList>[] {
    return [
      { key: 'legalPageId', label: 'ID', dataKey: 'legalPageId', sortable: true, width: '80px' },
      { key: 'title', label: 'Title', dataKey: 'title', sortable: true, searchable: true },
    ];
  }

  protected getItemId(item: ILegalPageList): number { return item.legalPageId; }
  protected getItemDisplayName(item: ILegalPageList): string { return item.title; }
}
