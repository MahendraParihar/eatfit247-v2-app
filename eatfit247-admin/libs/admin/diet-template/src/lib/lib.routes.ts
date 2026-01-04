import { Route } from '@angular/router';
import { DietTemplateComponent } from './diet-template.component';
import { DietTemplateDetailComponent } from './details/diet-template-detail.component';

export const dietTemplateRoutes: Route[] = [
  { path: '', component: DietTemplateComponent, title: 'Diet Templates' },
  { path: 'details/:dietTemplateId/cycle/:cycleNo', component: DietTemplateDetailComponent, title: 'Diet Template Detail' },
  { path: 'details/:dietTemplateId/cycle/:cycleNo/day/:dayNo', component: DietTemplateDetailComponent, title: 'Diet Template Detail' },
  { path: 'details/:dietTemplateId/cycle/:cycleNo/copy/:copyCycleId', component: DietTemplateDetailComponent, title: 'Diet Template Detail' },
  { path: 'details/:dietTemplateId/cycle/:cycleNo/day/:dayNo/copy/:copyCycleId/:copyDayNo', component: DietTemplateDetailComponent, title: 'Diet Template Detail' },
];
