import { Module } from '@nestjs/common';
import { MemberController } from './controllers/member.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { ModelList } from '../../core/database/db.model-list';
import { ExceptionService } from '../common/exception.service';
import { CommonService } from '../common/common.service';
import { FranchiseService } from '../franchise/franchise.service';
import { MemberService } from './services/member.service';
import { ReferrerService } from '../referrer/referrer.service';
import { AdminUserService } from '../admin-user/admin-user.service';
import { AssessmentController } from './controllers/assessment.controller';
import { AssessmentService } from './services/assessment.service';
import { GenderService } from '../lov/services/gender.service';
import { MaritalStatusService } from '../lov/services/marital-status.service';
import { ReligionService } from '../lov/services/religion.service';
import { LifestyleService } from '../lov/services/lifestyle.service';
import { EatingHabitService } from '../lov/services/eating-habit.service';
import { TypeOfExerciseService } from '../lov/services/type-of-exercise.service';
import { SleepingPatternService } from '../lov/services/sleeping-pattern.service';
import { BloodSugarService } from '../lov/services/blood-sugar.service';
import { UrineOutputService } from '../lov/services/urine-output.service';
import { MemberPocketGuideController } from './controllers/member-pocket-guide.controller';
import { MemberCallScheduleController } from './controllers/member-call-schedule.controller';
import { MemberIssuesController } from './controllers/member-issues.controller';
import { MemberCallScheduleService } from './services/member-call-schedule.service';
import { MemberPocketGuideService } from './services/member-pocket-guide.service';
import { MemberIssuesService } from './services/member-issues.service';
import { CallTypeService } from '../lov/services/call-type.service';
import { CallPurposeService } from '../lov/services/call-purpose.service';
import { CallStatusService } from '../lov/services/call-status.service';
import { MemberBodyStatsController } from './controllers/member-body-stats.controller';
import { MemberBodyStatsService } from './services/member-body-stats.service';
import { HealthParameterService } from '../lov/services/health-parameter.service';
import { HealthParameterUnitService } from '../lov/services/health-parameter-unit.service';
import { MemberHealthIssueService } from './services/member-health-issue.service';
import { MemberHealthIssueController } from './controllers/member-health-issue.controller';
import { MemberPaymentController } from './controllers/member-payment.controller';
import { MemberPaymentService } from './services/member-payment.service';
import { PaymentModeService } from '../lov/services/payment-mode.service';
import { ProgramService } from '../program-and-plan/services/program.service';
import { PlanService } from '../program-and-plan/services/plan.service';
import { CurrencyService } from '../lov/services/currency.service';
import { PaymentStatusService } from '../lov/services/payment-status.service';
import { ConfigParameterService } from '../config-parameter/config-parameter.service';
import { MemberDietPlanController } from './controllers/member-diet-plan.controller';
import { MemberDietPlanService } from './services/member-diet-plan.service';
import { RecipeCategoryService } from '../lov/services/recipe-category.service';
import { RecipeService } from '../recipe/recipe.service';
import { PdfModule } from 'src/core/pdf/pdf.module';
import { MailModule } from 'src/core/mail/mail.module';
import { DietTemplateService } from '../diet-template/diet-template.service';
import { MemberDashboardService } from './services/member-dashboard.service';

@Module({
  imports: [SequelizeModule.forFeature(ModelList), PdfModule, MailModule],
  controllers: [
    MemberController,
    AssessmentController,
    MemberPocketGuideController,
    MemberCallScheduleController,
    MemberIssuesController,
    MemberBodyStatsController,
    MemberHealthIssueController,
    MemberPaymentController,
    MemberDietPlanController,
  ],
  providers: [
    ExceptionService,
    MemberService,
    CommonService,
    FranchiseService,
    ReferrerService,
    AdminUserService,
    AssessmentService,
    GenderService,
    MaritalStatusService,
    ReligionService,
    LifestyleService,
    EatingHabitService,
    TypeOfExerciseService,
    SleepingPatternService,
    BloodSugarService,
    UrineOutputService,
    MemberCallScheduleService,
    MemberPocketGuideService,
    MemberIssuesService,
    CallTypeService,
    CallPurposeService,
    CallStatusService,
    MemberBodyStatsService,
    HealthParameterService,
    HealthParameterUnitService,
    RecipeCategoryService,
    RecipeService,
    MemberHealthIssueService,
    MemberPaymentService,
    PaymentModeService,
    ProgramService,
    PlanService,
    CurrencyService,
    PaymentStatusService,
    ConfigParameterService,
    MemberDietPlanService,
    DietTemplateService,
    MemberDashboardService,
  ],
})
export class MemberModule {
  constructor() {}
}
