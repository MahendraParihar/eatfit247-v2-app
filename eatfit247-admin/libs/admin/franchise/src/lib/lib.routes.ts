import { Route } from '@angular/router';
import { Franchise } from './franchise.component';
import { ManageFranchise } from './manage/manage-franchise.component';

export const franchiseRoutes: Route[] = [
  { path: '', component: Franchise, title: 'Franchise' },
  { path: 'new', component: ManageFranchise, title: 'Create Franchise' },
  { path: 'edit/:id', component: ManageFranchise, title: 'Edit Franchise' }
];
