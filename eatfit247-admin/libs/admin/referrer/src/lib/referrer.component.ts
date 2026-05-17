import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BaseListComponent, DataTableComponent, ITableAction, ITableColumn } from '@shared';
import { IReferrer } from '@eatfit247-shared-lib';
import { ReferrerApiService } from './api.service';

@Component({
  selector: 'lib-referrer',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './referrer.html',
  styleUrl: './referrer.scss',
})
export class Referrer extends BaseListComponent<IReferrer> {
  protected apiService = inject(ReferrerApiService);

  protected listConfig = {
    editRoute: '/referrer/edit',
    createRoute: '/referrer/new',
    searchPlaceholder: 'Search referrers...',
    emptyMessage: 'No referrers found',
  };

  protected buildEntityColumns(): ITableColumn<IReferrer>[] {
    return [
      { key: 'referrerId', label: 'ID', dataKey: 'referrerId', sortable: true, width: '80px' },
      { key: 'logo', label: 'Logo', dataKey: 'logo', sortable: false, searchable: false, isAvatar: true, type: 'image', width: '80px' },
      { key: 'name', label: 'Name', dataKey: 'name', sortable: true, searchable: true },
      { key: 'companyName', label: 'Company', dataKey: 'companyName', sortable: false },
      { key: 'emailId', label: 'Email', dataKey: 'emailId', sortable: false },
      { key: 'contactNumber', label: 'Contact', dataKey: 'contactNumber', sortable: false },
    ];
  }

  protected override buildExtraActions(): ITableAction<IReferrer>[] {
    return [
      { label: 'View', icon: 'visibility', color: 'primary', onClick: (row) => this.viewItem(row) },
    ];
  }

  protected getItemId(item: IReferrer): number { return item.referrerId; }
  protected getItemDisplayName(item: IReferrer): string { return item.name; }

  viewItem(item: IReferrer): void {
    // View referrer - implementation depends on requirements
  }
}
