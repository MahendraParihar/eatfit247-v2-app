import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BaseListComponent, DataTableComponent, ITableAction, ITableColumn } from '@shared';
import { IWarehouse } from '@eatfit247-shared-lib';
import { WarehousesApiService } from './api.service';

@Component({
  selector: 'lib-warehouses',
  standalone: true,
  imports: [CommonModule, DataTableComponent, MatButtonModule, MatIconModule],
  templateUrl: './warehouses.html',
  styleUrl: './warehouses.scss'
})
export class Warehouses extends BaseListComponent<IWarehouse> {
  protected apiService = inject(WarehousesApiService);

  protected listConfig = {
    editRoute: '/delivery/warehouses/edit',
    createRoute: '/delivery/warehouses/new',
    searchPlaceholder: 'Search warehouses...',
    emptyMessage: 'No warehouses found',
  };

  protected buildEntityColumns(): ITableColumn<IWarehouse>[] {
    return [
      { key: 'warehouseId', label: 'ID', dataKey: 'warehouseId', sortable: true, width: '80px' },
      { key: 'name', label: 'Name', dataKey: 'name', sortable: true, searchable: true },
      { key: 'contactName', label: 'Contact', dataKey: 'contactName', sortable: true, formatter: (v) => v ?? '-' },
      { key: 'city', label: 'City', dataKey: 'city', sortable: true },
      { key: 'pinCode', label: 'Pin Code', dataKey: 'pinCode', sortable: true },
    ];
  }

  protected override buildActions(): ITableAction<IWarehouse>[] {
    return [
      ...super.buildActions(),
      { label: 'Delete', icon: 'delete', color: 'warn', onClick: (row) => this.deleteItem(row) },
    ];
  }

  protected getItemId(item: IWarehouse): number { return item.warehouseId; }
  protected getItemDisplayName(item: IWarehouse): string { return item.name; }

  async deleteItem(item: IWarehouse): Promise<void> {
    const confirmed = confirm(`Are you sure you want to delete warehouse "${item.name}"?`);
    if (confirmed) {
      this.loading = true;
      try {
        await this.apiService.delete(item.warehouseId);
        await this.loadData();
      } finally {
        this.loading = false;
      }
    }
  }
}
