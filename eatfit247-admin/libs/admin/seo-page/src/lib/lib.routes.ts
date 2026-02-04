import { Route } from '@angular/router';
import { SeoPage } from './seo-page.component';
import { ManageSeoPage } from './manage/manage-seo-page.component';

export const seoPageRoutes: Route[] = [
  { path: '', component: SeoPage, title: 'SEO Pages' },
  { path: 'new', component: ManageSeoPage, title: 'Create SEO Page' },
  { path: 'edit/:id', component: ManageSeoPage, title: 'Edit SEO Page' }
];

