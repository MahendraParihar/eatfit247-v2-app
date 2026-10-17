import { Route } from '@angular/router';
import { PaymentReportComponent } from './payment-report/payment-report.component';
import { ContactFormReportComponent } from './contact-us-report/contact-form-report.component';
import { MemberProductReportComponent } from './member-product-report/member-product-report.component';
import { MemberIssuesReportComponent } from './member-issues-report/member-issues-report.component';
import { DocumentsIssuedReportComponent } from './documents-issued-report/documents-issued-report.component';

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
    path: 'member-issues',
    component: MemberIssuesReportComponent,
    title: 'Member Issues Report',
  },
  {
    path: 'documents-issued',
    component: DocumentsIssuedReportComponent,
    title: 'Documents Issued (GSTR-1 Table 13)',
  },
  {
    path: '',
    redirectTo: 'payment',
    pathMatch: 'full',
  },
];

