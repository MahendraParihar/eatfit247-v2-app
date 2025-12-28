import { Route } from '@angular/router';
import { AdminUser } from './admin-user.component';
import { ManageAdminUser } from './manage/manage-admin-user.component';
import { SettingComponent } from './setting/setting.component';
import { ChangePasswordComponent } from './change-password/change-password.component';

export const adminUserRoutes: Route[] = [
  { path: '', component: AdminUser, title: 'Admin Users' },
  { path: 'new', component: ManageAdminUser, title: 'Create Admin User' },
  { path: 'edit/:id', component: ManageAdminUser, title: 'Edit Admin User' }
];

export const settingRoutes: Route[] = [
  { path: '', component: SettingComponent, title: 'Setting' }
];

export const changePasswordRoutes: Route[] = [
  { path: '', component: ChangePasswordComponent, title: 'Change Password' }
];
