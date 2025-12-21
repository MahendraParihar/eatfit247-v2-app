import { Route } from '@angular/router';
import { ProgramPlans } from './program-plans.component';
import { ManageProgramPlan } from './manage/manage-program-plan.component';

export const programPlanRoutes: Route[] = [
  { path: '', component: ProgramPlans, title: 'Program Plans' },
  { path: 'new', component: ManageProgramPlan, title: 'Create Program Plan' },
  { path: 'edit/:id', component: ManageProgramPlan, title: 'Edit Program Plan' }
];
