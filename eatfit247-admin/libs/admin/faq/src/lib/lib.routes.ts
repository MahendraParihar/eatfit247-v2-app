import { Route } from '@angular/router';
import { Faq } from './faq.component';
import { ManageFaq } from './manage/manage-faq.component';

export const faqRoutes: Route[] = [
  { path: '', component: Faq, title: 'FAQ' },
  { path: 'new', component: ManageFaq, title: 'Create FAQ' },
  { path: 'edit/:id', component: ManageFaq, title: 'Edit FAQ' }
];
