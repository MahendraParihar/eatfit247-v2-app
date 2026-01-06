import { Route } from '@angular/router';
import { LegalPages } from './legal-pages.component';
import { ManageLegalPage } from './manage/manage-legal-page.component';

export const legalPagesRoutes: Route[] = [
  { path: '', component: LegalPages, title: 'Legal Pages' },
  { path: 'new', component: ManageLegalPage, title: 'Create Legal Page' },
  { path: 'edit/:id', component: ManageLegalPage, title: 'Edit Legal Page' }
];

