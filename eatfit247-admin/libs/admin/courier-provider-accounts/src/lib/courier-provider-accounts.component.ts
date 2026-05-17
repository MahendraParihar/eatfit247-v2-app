import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BaseListComponent, DataTableComponent, ITableColumn } from '@shared';
import { ICourierProviderAccount } from '@eatfit247-shared-lib';
import { CourierProviderAccountsApiService } from './api.service';

@Component({
  selector: 'lib-courier-provider-accounts',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './courier-provider-accounts.html',
  styleUrl: './courier-provider-accounts.scss'
})
export class CourierProviderAccounts extends BaseListComponent<ICourierProviderAccount> {
  protected apiService = inject(CourierProviderAccountsApiService);

  protected listConfig = {
    editRoute: '/delivery/courier-provider-accounts/edit',
    createRoute: '/delivery/courier-provider-accounts/new',
    searchPlaceholder: 'Search courier provider accounts...',
    emptyMessage: 'No courier provider accounts found',
  };

  protected buildEntityColumns(): ITableColumn<ICourierProviderAccount>[] {
    return [
      { key: 'providerAccountId', label: 'ID', dataKey: 'providerAccountId', sortable: true, width: '80px' },
      { key: 'provider', label: 'Provider', dataKey: 'provider', sortable: false, formatter: (value) => (value?.providerName || '-') },
      { key: 'franchise', label: 'Franchise', dataKey: 'franchise', sortable: false, formatter: (value) => (value?.companyName || '-') },
      { key: 'accountName', label: 'Account Name', dataKey: 'accountName', sortable: true, searchable: true, formatter: (value) => value || '-' },
      { key: 'apiBaseUrl', label: 'API Base URL', dataKey: 'apiBaseUrl', sortable: false, formatter: (value) => value || '-' },
    ];
  }

  protected getItemId(item: ICourierProviderAccount): number { return item.providerAccountId; }
  protected getItemDisplayName(item: ICourierProviderAccount): string { return item.accountName || `Account ${item.providerAccountId}`; }
}
