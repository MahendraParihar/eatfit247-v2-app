import { Route } from '@angular/router';
import { Members } from './members.component';
import { ManageMember } from './manage/manage-member.component';
import { MemberDetailsComponent } from './details/member-details.component';
import { MemberDashboardComponent } from './details/dashboard/member-dashboard.component';
import { MemberAssessmentComponent } from './details/assessment/member-assessment.component';
import { MemberPocketGuideComponent } from './details/pocket-guide/member-pocket-guide.component';
import { MemberHealthIssuesComponent } from './details/health-issues/member-health-issues.component';
import { MemberCallLogsComponent } from './details/call-logs/member-call-logs.component';
import { MemberPaymentHistoryComponent } from './details/payment-history/member-payment-history.component';
import { MemberDietHistoryComponent } from './details/diet-history/member-diet-history.component';
import { MemberHealthParameterLogsComponent } from './details/health-parameter-logs/member-health-parameter-logs.component';
import { MemberIssuesComponent } from './details/issues/member-issues.component';
import { MemberDietPlanListComponent } from './details/diet-plan/member-diet-plan-list.component';
import { MemberDietPlanDetailComponent } from './details/diet-plan/member-diet-plan-detail/member-diet-plan-detail.component';

export const membersRoutes: Route[] = [
  { path: '', component: Members, title: 'Members' },
  { path: 'new', component: ManageMember, title: 'Create Member' },
  { path: 'edit/:id', component: ManageMember, title: 'Edit Member' },
  {
    path: 'details/:id',
    component: MemberDetailsComponent,
    title: 'Member Details',
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: MemberDashboardComponent, title: 'Member Dashboard' },
      { path: 'assessment', component: MemberAssessmentComponent, title: 'Member Assessment' },
      { path: 'pocket-guide', component: MemberPocketGuideComponent, title: 'Member Pocket Guide' },
      { path: 'health-issues', component: MemberHealthIssuesComponent, title: 'Member Health Issues' },
      { path: 'call-logs', component: MemberCallLogsComponent, title: 'Member Call Logs' },
      { path: 'payment-history', component: MemberPaymentHistoryComponent, title: 'Member Payment History' },
      { path: 'diet-history', component: MemberDietHistoryComponent, title: 'Member Diet History' },
      { path: 'diet-plan', component: MemberDietPlanListComponent, title: 'Member Diet Plan' },
      { path: 'diet-plan/:dietId/cycle/:cycleId', component: MemberDietPlanDetailComponent, title: 'Member Diet Plan Detail' },
      { path: 'diet-plan/:dietId/cycle/:cycleId/day/:dayNo', component: MemberDietPlanDetailComponent, title: 'Member Diet Plan Detail' },
      { path: 'diet-plan/:dietId/cycle/:cycleId/copy/:copyCycleId', component: MemberDietPlanDetailComponent, title: 'Member Diet Plan Detail' },
      { path: 'diet-plan/:dietId/cycle/:cycleId/day/:dayNo/copy/:copyCycleId/:copyDayNo', component: MemberDietPlanDetailComponent, title: 'Member Diet Plan Detail' },
      { path: 'health-parameter-logs', component: MemberHealthParameterLogsComponent, title: 'Member Health Parameter Logs' },
      { path: 'issues', component: MemberIssuesComponent, title: 'Member Issues' },
    ],
  },
];
