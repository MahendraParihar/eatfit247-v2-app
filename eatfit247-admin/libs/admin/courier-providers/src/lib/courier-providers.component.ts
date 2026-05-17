import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BaseListComponent, DataTableComponent, ITableColumn } from '@shared';
import { ICourierProvider } from '@eatfit247-shared-lib';
import { CourierProvidersApiService } from './api.service';

@Component({
  selector: 'lib-courier-providers',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './courier-providers.html',
  styleUrl: './courier-providers.scss'
})
export class CourierProviders extends BaseListComponent<ICourierProvider> {
  protected apiService = inject(CourierProvidersApiService);

  protected listConfig = {
    editRoute: '/delivery/courier-providers/edit',
    createRoute: '/delivery/courier-providers/new',
    searchPlaceholder: 'Search courier providers...',
    emptyMessage: 'No courier providers found',
  };

  protected buildEntityColumns(): ITableColumn<ICourierProvider>[] {
    return [
      { key: 'courierProviderId', label: 'ID', dataKey: 'courierProviderId', sortable: true, width: '80px' },
      { key: 'providerCode', label: 'Provider Code', dataKey: 'providerCode', sortable: true, searchable: true },
      { key: 'providerName', label: 'Provider Name', dataKey: 'providerName', sortable: true, searchable: true },
      { key: 'authType', label: 'Auth Type', dataKey: 'authType', sortable: true, formatter: (value) => value || '-' },
      { key: 'supportsRateApi', label: 'Rate API', dataKey: 'supportsRateApi', sortable: true, width: '100px', align: 'center', formatter: (value) => (value ? 'Yes' : 'No') },
      { key: 'supportsWebhook', label: 'Webhook', dataKey: 'supportsWebhook', sortable: true, width: '100px', align: 'center', formatter: (value) => (value ? 'Yes' : 'No') },
      { key: 'supportsCod', label: 'COD', dataKey: 'supportsCod', sortable: true, width: '100px', align: 'center', formatter: (value) => (value ? 'Yes' : 'No') },
      { key: 'priorityOrder', label: 'Priority', dataKey: 'priorityOrder', sortable: true, width: '100px', align: 'center' },
    ];
  }

  protected getItemId(item: ICourierProvider): number { return item.courierProviderId; }
  protected getItemDisplayName(item: ICourierProvider): string { return item.providerName; }
}
