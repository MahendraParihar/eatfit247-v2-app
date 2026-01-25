import { Route } from '@angular/router';
import { PaymentReportComponent } from './payment-report/payment-report.component';
import { ContactFormReportComponent } from './contact-us-report/contact-form-report.component';
import { MemberProductReportComponent } from './member-product-report/member-product-report.component';

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
    path: 'member-product',
    component: MemberProductReportComponent,
    title: 'Member Product Order Report',
  },
  {
    path: '',
    redirectTo: 'payment',
    pathMatch: 'full',
  },
];

