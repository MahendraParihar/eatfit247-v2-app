import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ProgramPlanModule } from '@server_1/modules/program-plan';
import { TaxEngineModule } from '@server_1/modules/tax-engine';
import { AssessmentModule } from '@server_1/modules/assessment';
import {
  MstAdminUser,
  modelRegistry,
  MstFranchise,
} from '@server_1/core';
import {
  MstCountry,
  TxnAddress,
  MstPaymentMode,
  MstPaymentStatus,
} from '@server_1/platform';
import {
  MstPocketGuide,
} from '@server_1/modules/pocket-guide';
import {
  MstIssueStatus,
  MstIssueCategory,
} from '@server_1/modules/issues';
import {
  MstCallType,
  MstCallPurpose,
  MstCallLogStatus,
} from '@server_1/modules/call-logs';
import {
  MstProgramPlan,
  MstProgram,
} from '@server_1/modules/program-plan';
import {
  MstReferrer,
} from '@server_1/modules/referrer';
import {
  MstGender,
  MstMaritalStatus,
  MstReligion,
  MstLifestyle,
  MstEatingHabit,
  MstTypeOfExercise,
  MstSleepingPattern,
  MstBloodSugar,
  MstUrineOutput,
  MstHealthIssue,
  MstHealthParameter,
  MstHealthParameterUnit,
} from '@server_1/modules/assessment';
import { TxnMember, TxnMemberPocketGuide, TxnMemberHealthIssue, TxnMemberIssue, TxnMemberIssueResponse, TxnMemberHealthParameterLog, TxnMemberHealthParameter, TxnAssessment, TxnMemberPayment, TxnMemberDietPlan, TxnMemberDietDetail } from './models';
import {
  MemberController,
  PublicMemberController,
  MemberHealthController,
  MemberCallLogController,
  MemberContentController,
  MemberIssueController,
  MemberPaymentController,
  MemberDashboardController,
} from './controllers';
import {
  MemberService,
  MemberPocketGuideService,
  MemberHealthIssueService,
  MemberCallLogsService,
  MemberHealthParameterLogsService,
  MemberIssueService,
  MemberIssueResponseService,
  MemberAssessmentService, MemberPaymentService,
} from './services';
import { TxnMemberCallLog } from './models';
import { CallLogsModule } from '@server_1/modules/call-logs';
import { PocketGuideModule } from '@server_1/modules/pocket-guide';
import { IssuesModule } from '@server_1/modules/issues';
// Register models with the model registry
modelRegistry.register([
  TxnMember,
  TxnMemberPocketGuide,
  TxnMemberHealthIssue,
  TxnMemberIssue,
  TxnMemberIssueResponse,
  TxnMemberCallLog,
  TxnMemberHealthParameterLog,
  TxnMemberHealthParameter,
  TxnAssessment,
  TxnMemberPayment,
  TxnMemberDietPlan,
  TxnMemberDietDetail,
]);

@Module({
  imports: [
    // Import ProgramPlanModule to use ProgramService and ProgramPlanService
    ProgramPlanModule,
    CallLogsModule,
    TaxEngineModule,
    AssessmentModule,
    PocketGuideModule,
    IssuesModule,
    SequelizeModule.forFeature([
      // Member transaction models (local)
      TxnMember,
      TxnMemberPocketGuide,
      TxnMemberHealthIssue,
      TxnMemberIssue,
      TxnMemberIssueResponse,
      TxnMemberCallLog,
      TxnMemberHealthParameterLog,
      TxnMemberHealthParameter,
      TxnAssessment,
      TxnMemberPayment,
      TxnMemberDietPlan,
      TxnMemberDietDetail,
      // Core/platform models (allowed)
      MstFranchise,
      MstCountry,
      MstAdminUser,
      TxnAddress,
      MstPaymentMode,
      MstPaymentStatus,
      // Note: Models from other feature modules (pocket-guide, issues, call-logs, program-plan, referrer, assessment)
      // are already registered by their respective modules and available through Sequelize's model registry
    ]),
  ],
  controllers: [
    MemberController,
    PublicMemberController,
    MemberHealthController,
    MemberCallLogController,
    MemberContentController,
    MemberIssueController,
    MemberPaymentController,
    MemberDashboardController,
  ],
  providers: [
    MemberService,
    MemberPocketGuideService,
    MemberHealthIssueService,
    MemberCallLogsService,
    MemberHealthParameterLogsService,
    MemberIssueService,
    MemberIssueResponseService,
    MemberAssessmentService,
    MemberPaymentService
  ],
  exports: [
    MemberService,
    SequelizeModule,
  ],
})
export class MemberModule {
}
