import { Route } from '@angular/router';
import { RoleList } from './role-list/role-list.component';
import { RoleManage } from './role-manage/role-manage.component';
import { PermissionMatrix } from './permission-matrix/permission-matrix.component';
import { SubjectList } from './subject-list/subject-list.component';

export const adminRbacRoutes: Route[] = [
  { path: '', component: RoleList, title: 'Admin Roles' },
  { path: 'new', component: RoleManage, title: 'Create Role' },
  { path: 'edit/:id', component: RoleManage, title: 'Edit Role' },
  { path: ':id/permissions', component: PermissionMatrix, title: 'Permission Matrix' },
  { path: 'subjects', component: SubjectList, title: 'Subjects' },
];
