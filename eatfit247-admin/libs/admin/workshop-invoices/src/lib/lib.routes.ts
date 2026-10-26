import { Route } from '@angular/router';
import { WorkshopInvoiceList } from './workshop-invoices.component';
import { ManageWorkshopInvoice } from './manage/manage-workshop-invoice.component';

export const workshopInvoicesRoutes: Route[] = [
  { path: '', component: WorkshopInvoiceList, title: 'Workshop Invoices' },
  { path: 'new', component: ManageWorkshopInvoice, title: 'New Workshop Invoice' },
  { path: 'edit/:id', component: ManageWorkshopInvoice, title: 'Edit Workshop Invoice' },
];
