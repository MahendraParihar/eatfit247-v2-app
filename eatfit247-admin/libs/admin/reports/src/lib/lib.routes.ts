import { Route } from '@angular/router';
import { PaymentReportComponent } from './payment-report/payment-report.component';
import { ContactFormReportComponent } from './contact-us-report/contact-form-report.component';

export const reportsRoutes: Route[] = [
  {
    path: 'payment',
    component: PaymentReportComponent,
    title: 'Payment Report',
  },
  {
    path: 'contact-form',
    component: ContactFormReportComponent,
    title: 'Contact Form Report',
  },
  {
    path: '',
    redirectTo: 'payment',
    pathMatch: 'full',
  },
];

