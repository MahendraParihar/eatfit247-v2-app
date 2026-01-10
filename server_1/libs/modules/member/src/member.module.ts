import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ProgramPlanModule } from '@server_1/modules/program-plan';
import { TaxEngineModule } from '@server_1/modules/tax-engine';
import { AssessmentModule } from '@server_1/modules/assessment';
import { RecipeModule } from '@server_1/modules/recipe';
import { DietModule, TxnDietTemplateDietDetail } from '@server_1/modules/diet';
import { modelRegistry, MstAdminUser, MstFranchise } from '@server_1/core';
import { MstCountry, MstPaymentMode, MstPaymentStatus, TxnAddress } from '@server_1/platform';
import { PocketGuideModule } from '@server_1/modules/pocket-guide';
import { IssuesModule } from '@server_1/modules/issues';
import { CallLogsModule } from '@server_1/modules/call-logs';
import {
  TxnAssessment,
  TxnMember,
  TxnMemberCallLog,
  TxnMemberDietDetail,
  TxnMemberDietPlan,
  TxnMemberHealthIssue,
  TxnMemberHealthParameter,
  TxnMemberHealthParameterLog,
  TxnMemberIssue,
  TxnMemberIssueResponse,
  TxnMemberPayment,
  TxnMemberPocketGuide,
} from './models';
import {
  MemberCallLogController,
  MemberContentController,
  MemberController,
  MemberDashboardController,
  MemberDietPlanController,
  MemberHealthController,
  MemberIssueController,
  MemberPaymentController,
} from './controllers';
import { PublicMemberController, PublicMemberPaymentController } from './controllers/public';
import {
  MemberAssessmentService,
  MemberCallLogsService,
  MemberDashboardService,
  MemberDietPlanService,
  MemberHealthIssueService,
  MemberHealthParameterLogsService,
  MemberIssueResponseService,
  MemberIssueService,
  MemberPaymentService,
  MemberPocketGuideService,
  MemberService,
} from './services';
import { FranchiseModule } from '@server_1/modules/franchise';
import { PaymentModule } from '@server_1/modules/payment';
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
    FranchiseModule,
    PaymentModule,
    RecipeModule,
    DietModule,
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
      // Diet template models
      TxnDietTemplateDietDetail,
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
    MemberHealthController,
    MemberCallLogController,
    MemberContentController,
    MemberIssueController,
    MemberPaymentController,
    MemberDashboardController,
    MemberDietPlanController,
    PublicMemberPaymentController,
    PublicMemberController,
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
    MemberPaymentService,
    MemberDietPlanService,
    MemberDashboardService,
  ],
  exports: [
    MemberService,
    SequelizeModule,
  ],
})
export class MemberModule {
}
