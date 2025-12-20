import { Route } from '@angular/router';
import { Members } from './members.component';
import { ManageMember } from './manage/manage-member.component';

export const membersRoutes: Route[] = [
  { path: '', component: Members, title: 'Members' },
  { path: 'new', component: ManageMember, title: 'Create Member' },
  { path: 'edit/:id', component: ManageMember, title: 'Edit Member' }
];
