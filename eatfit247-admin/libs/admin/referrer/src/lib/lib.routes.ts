import { Route } from '@angular/router';
import { Referrer } from './referrer.component';
import { ManageReferrer } from './manage/manage-referrer.component';

export const referrerRoutes: Route[] = [
  { path: '', component: Referrer, title: 'Referrer' },
  { path: 'new', component: ManageReferrer, title: 'Create Referrer' },
  { path: 'edit/:id', component: ManageReferrer, title: 'Edit Referrer' }
];
