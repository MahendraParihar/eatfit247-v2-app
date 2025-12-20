import { Route } from '@angular/router';
import { Programs } from './programs.component';
import { ManageProgram } from './manage/manage-program.component';

export const programsRoutes: Route[] = [
  { path: '', component: Programs, title: 'Programs' },
  { path: 'new', component: ManageProgram, title: 'Create Program' },
  { path: 'edit/:id', component: ManageProgram, title: 'Edit Program' }
];
