import { Route } from '@angular/router';
import { AdminUser } from './admin-user.component';
import { ManageAdminUser } from './manage/manage-admin-user.component';

export const adminUserRoutes: Route[] = [
  { path: '', component: AdminUser, title: 'Admin Users' },
  { path: 'new', component: ManageAdminUser, title: 'Create Admin User' },
  { path: 'edit/:id', component: ManageAdminUser, title: 'Edit Admin User' }
];
