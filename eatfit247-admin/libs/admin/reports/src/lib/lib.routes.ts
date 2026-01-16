import { Route } from '@angular/router';
import { PaymentReportComponent } from './payment-report.component';

export const reportsRoutes: Route[] = [
  {
    path: 'payment',
    component: PaymentReportComponent,
    title: 'Payment Report',
  },
  {
    path: '',
    redirectTo: 'payment',
    pathMatch: 'full',
  },
];

