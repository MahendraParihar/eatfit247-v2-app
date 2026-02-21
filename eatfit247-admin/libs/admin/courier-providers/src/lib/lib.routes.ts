import { Route } from '@angular/router';
import { CourierProviders } from './courier-providers.component';
import { ManageCourierProvider } from './manage/manage-courier-provider.component';

export const courierProvidersRoutes: Route[] = [
  { path: '', component: CourierProviders, title: 'Courier Providers' },
  { path: 'new', component: ManageCourierProvider, title: 'Create Courier Provider' },
  { path: 'edit/:id', component: ManageCourierProvider, title: 'Edit Courier Provider' }
];

