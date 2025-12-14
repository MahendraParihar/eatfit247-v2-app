import { Route } from '@angular/router';
import { AdminUser } from './admin-user/admin-user';

export const adminUserRoutes: Route[] = [{ path: '', component: AdminUser, title: 'Admin Users' }];
