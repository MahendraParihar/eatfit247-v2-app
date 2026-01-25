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
  TxnMemberProduct,
  TxnMemberProductOrderItem,
  TxnShipment,
  TxnShipmentItem,
  TxnShipmentTrackingEvent,
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
  MemberProductController,
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
  MemberProductService,
  MemberService,
} from './services';
import { FranchiseModule } from '@server_1/modules/franchise';
import { PaymentModule } from '@server_1/modules/payment';
import { ProductModule } from '@server_1/modules/product';
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
  TxnMemberProduct,
  TxnMemberProductOrderItem,
  TxnMemberDietPlan,
  TxnMemberDietDetail,
  TxnShipment,
  TxnShipmentItem,
  TxnShipmentTrackingEvent,
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
    ProductModule,
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
      TxnMemberProduct,
      TxnMemberProductOrderItem,
      TxnMemberDietPlan,
      TxnMemberDietDetail,
      TxnShipment,
      TxnShipmentItem,
      TxnShipmentTrackingEvent,
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
    MemberProductController,
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
    MemberProductService,
    MemberDietPlanService,
    MemberDashboardService,
  ],
  exports: [
    MemberService,
    MemberPaymentService,
    MemberProductService,
    SequelizeModule,
  ],
})
export class MemberModule {
}
