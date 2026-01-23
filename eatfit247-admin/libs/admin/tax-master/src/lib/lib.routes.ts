import { Route } from '@angular/router';
import { TaxMasterComponent } from './tax-master.component';
import { ManageTaxMasterComponent } from './manage/manage-tax-master.component';

export const taxMasterRoutes: Route[] = [
  { path: '', component: TaxMasterComponent, title: 'Tax Master' },
  { path: 'new', component: ManageTaxMasterComponent, title: 'Create Tax Rule' },
  { path: 'edit/:id', component: ManageTaxMasterComponent, title: 'Edit Tax Rule' },
];


