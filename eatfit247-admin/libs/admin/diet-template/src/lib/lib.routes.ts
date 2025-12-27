import { Route } from '@angular/router';
import { DietTemplateComponent } from './diet-template.component';
import { ManageDietTemplateComponent } from './manage/manage-diet-template.component';

export const dietTemplateRoutes: Route[] = [
  { path: '', component: DietTemplateComponent, title: 'Diet Templates' },
  { path: 'new', component: ManageDietTemplateComponent, title: 'Create Diet Template' },
  { path: 'edit/:id', component: ManageDietTemplateComponent, title: 'Edit Diet Template' },
];
