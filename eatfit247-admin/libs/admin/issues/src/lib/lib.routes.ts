import { Route } from '@angular/router';
import { Issues } from './issues.component';
import { ManageIssue } from './manage/manage-issue.component';

export const issuesRoutes: Route[] = [
  { path: '', component: Issues, title: 'Issues' },
  { path: 'new', component: ManageIssue, title: 'Create Issue' },
  { path: 'edit/:id', component: ManageIssue, title: 'Edit Issue' }
];
