import { Route } from '@angular/router';
import { CourierProviderAccounts } from './courier-provider-accounts.component';
import { ManageCourierProviderAccount } from './manage/manage-courier-provider-account.component';

export const courierProviderAccountsRoutes: Route[] = [
  { path: '', component: CourierProviderAccounts, title: 'Courier Provider Accounts' },
  { path: 'new', component: ManageCourierProviderAccount, title: 'Create Courier Provider Account' },
  { path: 'edit/:id', component: ManageCourierProviderAccount, title: 'Edit Courier Provider Account' }
];

