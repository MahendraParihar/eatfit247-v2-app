import { Route } from '@angular/router';
import { AdminUser } from './admin-user/admin-user.component';

export const adminUserRoutes: Route[] = [{ path: '', component: AdminUser, title: 'Admin Users' }];
