import { Route } from '@angular/router';
import { Franchise } from './franchise.component';
import { ManageFranchise } from './manage/manage-franchise.component';
import { FranchiseDetailsComponent } from './details/franchise-details.component';
import { FranchiseDashboardComponent } from './details/dashboard/franchise-dashboard.component';
import { LutRegisterComponent } from './details/lut-register/lut-register.component';

export const franchiseRoutes: Route[] = [
  { path: '', component: Franchise, title: 'Franchise' },
  { path: 'new', component: ManageFranchise, title: 'Create Franchise' },
  { path: 'edit/:id', component: ManageFranchise, title: 'Edit Franchise' },
  {
    path: 'details/:id',
    component: FranchiseDetailsComponent,
    title: 'Franchise Details',
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: FranchiseDashboardComponent, title: 'Franchise Dashboard' },
      { path: 'lut-register', component: LutRegisterComponent, title: 'LUT Register' },
    ],
  },
];
