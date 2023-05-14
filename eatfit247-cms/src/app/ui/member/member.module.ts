import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MemberListComponent} from './member-list/member-list.component';
import {MemberManageComponent} from './member-manage/member-manage.component';
import {AssessmentManageComponent} from './assessment-manage/assessment-manage.component';
import {MemberPaymentHistoryComponent} from './member-payment-history/member-payment-history.component';
import {MemberRoutingModule} from "./member-routing.module";
import {MaterialModule} from "../../material.module";
import {FlexLayoutModule} from "@angular/flex-layout";
import {ShareModule} from "../shared/share.module";
import {MemberDetailComponent} from './member-detail/member-detail.component';
import {MemberAssessmentComponent} from './member-assessment/member-assessment.component';
import {MemberDietPlanListComponent} from './member-diet-plan-list/member-diet-plan-list.component';
import {MemberBodyStatsListComponent} from './member-body-stats-list/member-body-stats-list.component';
import {MemberPocketGuideComponent} from './member-pocket-guide/member-pocket-guide.component';
import {MemberCallScheduleComponent} from './member-call-schedule/member-call-schedule.component';
import {MemberIssuesListComponent} from './member-issues-list/member-issues-list.component';
import {
  MemberCallScheduleManageDialogComponent
} from './member-call-schedule-manage-dialog/member-call-schedule-manage-dialog.component';
import {
  MemberBodyStatsManageDialogComponent
} from './member-body-stats-manage-dialog/member-body-stats-manage-dialog.component';
import {MemberHealthIssueComponent} from './member-health-issue/member-health-issue.component';
import {AssessmentDetailDialogComponent} from './assessment-detail-dialog/assessment-detail-dialog.component';
import {
  HealthIssueSelectionDialogComponent
} from './health-issue-selection-dialog/health-issue-selection-dialog.component';
import {
  PocketGuideSelectionDialogComponent
} from './pocket-guide-selection-dialog/pocket-guide-selection-dialog.component';
import {
  MemberPaymentManageDialogComponent
} from './member-payment-manage-dialog/member-payment-manage-dialog.component';
import {MemberDietPlanDetailComponent} from './member-diet-plan-detail/member-diet-plan-detail.component';
import {
  MemberDietPlanDetailsDialogComponent
} from './member-diet-plan-details-dialog/member-diet-plan-details-dialog.component';
import {
  MemberPaymentInvoiceDialogComponent
} from './member-payment-invoice-dialog/member-payment-invoice-dialog.component';
import {MemberIssueDialogComponent} from './member-issue-dialog/member-issue-dialog.component';
import {MemberDashboardComponent} from './member-dashboard/member-dashboard.component';
import {
  MemberPocketGuideManageDialogComponent
} from './member-pocket-guide-manage-dialog/member-pocket-guide-manage-dialog.component';
import {
  MemberHealthIssueManageDialogComponent
} from './member-health-issue-manage-dialog/member-health-issue-manage-dialog.component';


@NgModule({
  declarations: [
    MemberListComponent,
    MemberManageComponent,
    AssessmentManageComponent,
    MemberPaymentHistoryComponent,
    MemberDetailComponent,
    MemberAssessmentComponent,
    MemberDietPlanListComponent,
    MemberBodyStatsListComponent,
    MemberPocketGuideComponent,
    MemberCallScheduleComponent,
    MemberIssuesListComponent,
    MemberCallScheduleManageDialogComponent,
    MemberBodyStatsManageDialogComponent,
    MemberHealthIssueComponent,
    AssessmentDetailDialogComponent,
    HealthIssueSelectionDialogComponent,
    PocketGuideSelectionDialogComponent,
    MemberPaymentManageDialogComponent,
    MemberDietPlanDetailComponent,
    MemberDietPlanDetailsDialogComponent,
    MemberPaymentInvoiceDialogComponent,
    MemberIssueDialogComponent,
    MemberDashboardComponent,
    MemberPocketGuideManageDialogComponent,
    MemberHealthIssueManageDialogComponent
  ],
  imports: [
    MaterialModule,
    FlexLayoutModule,
    CommonModule,
    ShareModule,
    MemberRoutingModule
  ],
  entryComponents: [
    MemberCallScheduleManageDialogComponent,
    MemberBodyStatsManageDialogComponent,
    AssessmentDetailDialogComponent,
    MemberPaymentManageDialogComponent,
    MemberPocketGuideManageDialogComponent,
    MemberHealthIssueManageDialogComponent
  ]
})
export class MemberModule {
}
