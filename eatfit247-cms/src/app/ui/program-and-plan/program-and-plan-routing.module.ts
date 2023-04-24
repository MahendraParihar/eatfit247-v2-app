import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AuthGuard} from "../../guard/auth-guard";
import {ProgramListComponent} from "./program-list/program-list.component";
import {ProgramManageComponent} from "./program-manage/program-manage.component";
import {PlanListComponent} from "./plan-list/plan-list.component";
import {PlanManageComponent} from "./plan-manage/plan-manage.component";
import {ProgramFaqListComponent} from "./program-faq-list/program-faq-list.component";
import {ProgramFaqManageComponent} from "./program-faq-manage/program-faq-manage.component";

const routes: Routes = [
  {
    path: 'program-list',
    canActivate: [AuthGuard],
    component: ProgramListComponent
  },
  {
    path: 'program-manage',
    canActivate: [AuthGuard],
    component: ProgramManageComponent
  },
  {
    path: 'program-manage/:id',
    canActivate: [AuthGuard],
    component: ProgramManageComponent
  },

  {
    path: 'plan-list',
    canActivate: [AuthGuard],
    component: PlanListComponent
  },
  {
    path: 'plan-manage',
    canActivate: [AuthGuard],
    component: PlanManageComponent
  },
  {
    path: 'plan-manage/:id',
    canActivate: [AuthGuard],
    component: PlanManageComponent
  },

  {
    path: 'program-list/:programId/plan-list',
    canActivate: [AuthGuard],
    component: ProgramFaqListComponent
  },
  {
    path: 'program-list/:programId/plan-manage',
    canActivate: [AuthGuard],
    component: ProgramFaqManageComponent
  },
  {
    path: 'program-list/:programId/plan-manage/:id',
    canActivate: [AuthGuard],
    component: ProgramFaqManageComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProgramAndPlanRoutingModule {
}
