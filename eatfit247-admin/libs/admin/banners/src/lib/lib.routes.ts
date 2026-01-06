import { Route } from '@angular/router';
import { Banners } from './banners.component';
import { ManageBanner } from './manage/manage-banner.component';

export const bannersRoutes: Route[] = [
  { path: '', component: Banners, title: 'Banners' },
  { path: 'new', component: ManageBanner, title: 'Create Banner' },
  { path: 'edit/:id', component: ManageBanner, title: 'Edit Banner' }
];

