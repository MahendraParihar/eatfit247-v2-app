import { Route } from '@angular/router';
import { Warehouses } from './warehouses.component';
import { ManageWarehouse } from './manage/manage-warehouse.component';

export const warehousesRoutes: Route[] = [
  { path: '', component: Warehouses, title: 'Warehouses' },
  { path: 'new', component: ManageWarehouse, title: 'Create Warehouse' },
  { path: 'edit/:id', component: ManageWarehouse, title: 'Edit Warehouse' }
];
