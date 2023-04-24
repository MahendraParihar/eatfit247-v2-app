import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AuthGuard} from "../../guard/auth-guard";
import {MemberListComponent} from "./member-list/member-list.component";
import {MemberManageComponent} from "./member-manage/member-manage.component";
import {AssessmentManageComponent} from "./assessment-manage/assessment-manage.component";
import {MemberPaymentHistoryComponent} from "./member-payment-history/member-payment-history.component";
import {MemberDetailComponent} from "./member-detail/member-detail.component";
import {MemberPocketGuideComponent} from "./member-pocket-guide/member-pocket-guide.component";
import {MemberCallScheduleComponent} from "./member-call-schedule/member-call-schedule.component";
import {MemberBodyStatsListComponent} from "./member-body-stats-list/member-body-stats-list.component";
import {MemberHealthIssueComponent} from "./member-health-issue/member-health-issue.component";
import {MemberDietPlanListComponent} from "./member-diet-plan-list/member-diet-plan-list.component";
import {MemberIssuesListComponent} from "./member-issues-list/member-issues-list.component";
import {MemberDietPlanDetailComponent} from "./member-diet-plan-detail/member-diet-plan-detail.component";
import {MemberDashboardComponent} from "./member-dashboard/member-dashboard.component";

const routes: Routes = [
  {
    path: 'list',
    canActivate: [AuthGuard],
    component: MemberListComponent
  },
  {
    path: 'manage',
    canActivate: [AuthGuard],
    component: MemberManageComponent
  },
  {
    path: 'manage/:id',
    canActivate: [AuthGuard],
    component: MemberManageComponent
  },
  {
    path: 'detail/:id',
    canActivate: [AuthGuard],
    component: MemberDetailComponent,
    children: [
      {
        path: '',
        canActivate: [AuthGuard],
        component: MemberDashboardComponent
      },
      {
        path: 'assessment-manage',
        canActivate: [AuthGuard],
        component: AssessmentManageComponent
      },
      {
        path: 'payment-history',
        canActivate: [AuthGuard],
        component: MemberPaymentHistoryComponent
      },
      {
        path: 'pocket-guide',
        canActivate: [AuthGuard],
        component: MemberPocketGuideComponent
      },
      {
        path: 'health-issue',
        canActivate: [AuthGuard],
        component: MemberHealthIssueComponent
      },
      {
        path: 'call-schedule',
        canActivate: [AuthGuard],
        component: MemberCallScheduleComponent
      },
      {
        path: 'body-stats',
        canActivate: [AuthGuard],
        component: MemberBodyStatsListComponent
      },
      {
        path: 'diet-plan',
        canActivate: [AuthGuard],
        component: MemberDietPlanListComponent
      },
      {
        path: 'diet-plan-detail/:dietId/:cycleId',
        canActivate: [AuthGuard],
        component: MemberDietPlanDetailComponent
      },
      {
        path: 'diet-plan-detail/:dietId/:cycleId/:dayNo',
        canActivate: [AuthGuard],
        component: MemberDietPlanDetailComponent
      },
      {
        path: 'issues',
        canActivate: [AuthGuard],
        component: MemberIssuesListComponent
      }
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MemberRoutingModule {
}
