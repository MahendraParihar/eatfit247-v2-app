import { AfterViewInit, Component, TemplateRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BaseListComponent, DataTableComponent, ITableAction, ITableColumn } from '@shared';
import { IFranchise } from '@eatfit247-shared-lib';
import { FranchiseApiService } from './api.service';

@Component({
  selector: 'lib-franchise',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './franchise.html',
  styleUrl: './franchise.scss',
})
export class Franchise extends BaseListComponent<IFranchise> implements AfterViewInit {
  protected apiService = inject(FranchiseApiService);

  protected listConfig = {
    editRoute: '/franchise/edit',
    createRoute: '/franchise/new',
    searchPlaceholder: 'Search franchise...',
    emptyMessage: 'No franchise records found',
  };

  @ViewChild('companyNameCell', { static: false })
  companyNameCellTemplate!: TemplateRef<any>;

  ngAfterViewInit(): void {
    // Attach custom cell template for company name column and trigger table re-initialization
    if (this.tableConfig?.columns) {
      if (this.companyNameCellTemplate) {
        const companyNameColumn = this.tableConfig.columns.find(
          (col) => col.key === 'companyName'
        );
        if (companyNameColumn) {
          companyNameColumn.cellTemplate = this.companyNameCellTemplate;
          // Reassign config reference so data table detects the change
          this.tableConfig = {
            ...this.tableConfig,
            columns: [...this.tableConfig.columns],
          };
        }
      }
    }
  }

  protected buildEntityColumns(): ITableColumn<IFranchise>[] {
    return [
      { key: 'franchiseId', label: 'ID', dataKey: 'franchiseId', sortable: true, width: '80px' },
      {
        key: 'logo',
        label: 'Logo',
        dataKey: 'logo',
        type: 'image',
        isAvatar: true,
        imageAlt: 'Franchise Logo',
        sortable: false,
        width: '80px',
        align: 'center',
      },
      { key: 'companyName', label: 'Company Name', dataKey: 'companyName', sortable: true, searchable: true },
      { key: 'franchiseCode', label: 'Code', dataKey: 'franchiseCode', sortable: true },
      {
        key: 'name',
        label: 'Name',
        dataKey: 'firstName',
        sortable: true,
        searchable: true,
        formatter: (value, row) => {
          const firstName = row?.firstName || '';
          const lastName = row?.lastName || '';
          return `${firstName} ${lastName}`.trim() || '-';
        },
      },
      { key: 'emailId', label: 'Email', dataKey: 'emailId', sortable: true, searchable: true },
      { key: 'contactNumber', label: 'Contact', dataKey: 'contactNumber', sortable: true },
    ];
  }

  protected override buildExtraActions(): ITableAction<IFranchise>[] {
    return [
      { label: 'View', icon: 'visibility', color: 'primary', onClick: (row) => this.viewItem(row) },
    ];
  }

  protected getItemId(item: IFranchise): number { return item.franchiseId; }
  protected getItemDisplayName(item: IFranchise): string { return item.companyName; }

  viewItem(item: IFranchise): void {
    this.router.navigate(['/franchise/details', item.franchiseId, 'dashboard']);
  }
}
