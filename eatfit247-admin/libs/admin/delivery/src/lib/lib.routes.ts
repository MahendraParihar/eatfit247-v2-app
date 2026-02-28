import { Route } from '@angular/router';
import { ShipmentFlowComponent } from './shipment-flow.component';

export const deliveryRoutes: Route[] = [
  {
    path: '',
    component: ShipmentFlowComponent,
    title: 'Shipment Flow',
  },
  {
    path: ':memberId/:memberProductId',
    component: ShipmentFlowComponent,
    title: 'Shipment Flow',
  },
];
