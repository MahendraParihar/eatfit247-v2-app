import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BaseListComponent, DataTableComponent, ITableAction, ITableColumn } from '@shared';
import { ICourierProviderWarehouse } from '@eatfit247-shared-lib';
import { CourierProviderWarehousesApiService } from './api.service';

@Component({
  selector: 'lib-courier-provider-warehouses',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './courier-provider-warehouses.html',
  styleUrl: './courier-provider-warehouses.scss'
})
export class CourierProviderWarehouses extends BaseListComponent<ICourierProviderWarehouse> {
  protected apiService = inject(CourierProviderWarehousesApiService);

  protected listConfig = {
    editRoute: '/delivery/courier-provider-warehouses/edit',
    createRoute: '/delivery/courier-provider-warehouses/new',
    searchPlaceholder: 'Search provider warehouse mappings...',
    emptyMessage: 'No provider warehouse mappings found',
  };

  protected buildEntityColumns(): ITableColumn<ICourierProviderWarehouse>[] {
    return [
      {
        key: 'courierProviderWarehouseId',
        label: 'ID',
        dataKey: 'courierProviderWarehouseId',
        sortable: true,
        width: '80px',
      },
      {
        key: 'warehouse',
        label: 'Warehouse',
        dataKey: 'warehouse',
        sortable: false,
        formatter: (v) => (v && typeof v === 'object' && 'name' in v ? (v as { name: string }).name : '-'),
      },
      {
        key: 'provider',
        label: 'Provider',
        dataKey: 'provider',
        sortable: false,
        formatter: (v) => (v && typeof v === 'object' && 'providerName' in v ? (v as { providerName: string }).providerName : '-'),
      },
      {
        key: 'providerWarehouseName',
        label: 'Provider Warehouse',
        dataKey: 'providerWarehouseName',
        sortable: true,
        formatter: (v) => v ?? '-',
      },
    ];
  }

  protected override buildActions(): ITableAction<ICourierProviderWarehouse>[] {
    return [
      ...super.buildActions(),
      { label: 'Delete', icon: 'delete', color: 'warn', onClick: (row) => this.deleteItem(row) },
    ];
  }

  protected getItemId(item: ICourierProviderWarehouse): number { return item.courierProviderWarehouseId; }
  protected getItemDisplayName(item: ICourierProviderWarehouse): string {
    return item.providerWarehouseName ?? `#${item.courierProviderWarehouseId}`;
  }

  async deleteItem(item: ICourierProviderWarehouse): Promise<void> {
    const name = this.getItemDisplayName(item);
    const confirmed = confirm(`Are you sure you want to delete "${name}"?`);
    if (confirmed) {
      this.loading = true;
      try {
        await this.apiService.delete(item.courierProviderWarehouseId);
        await this.loadData();
      } finally {
        this.loading = false;
      }
    }
  }
}
