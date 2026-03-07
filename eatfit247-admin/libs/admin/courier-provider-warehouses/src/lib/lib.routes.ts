import { Route } from '@angular/router';
import { CourierProviderWarehouses } from './courier-provider-warehouses.component';
import { ManageCourierProviderWarehouse } from './manage/manage-courier-provider-warehouse.component';

export const courierProviderWarehousesRoutes: Route[] = [
  { path: '', component: CourierProviderWarehouses, title: 'Courier Provider Warehouse Mapping' },
  { path: 'new', component: ManageCourierProviderWarehouse, title: 'Create Provider Warehouse Mapping' },
  { path: 'edit/:id', component: ManageCourierProviderWarehouse, title: 'Edit Provider Warehouse Mapping' }
];
