import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './core/database/database.module';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AllExceptionsFilter } from './http-exception.filter';
import { ServeStaticModule } from '@nestjs/serve-static';
import { CommonService } from './modules/common/common.service';
import { ExceptionService } from './modules/common/exception.service';
import { CommonController } from './modules/common/controllers/common.controller';
import { ConfigParametersController } from './modules/common/controllers/config-parameters.controller';
import { HealthController } from './modules/common/controllers/health.controller';
import { TerminusModule } from '@nestjs/terminus';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtModule } from '@nestjs/jwt';
import { Env } from './util/env.values';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './modules/account/jwt.strategy';
import { JwtAuthGuard } from './modules/account/jwt-auth.guard';
import { SequelizeModule } from '@nestjs/sequelize';
import { ModelList } from './core/database/db.model-list';
import { MailModule } from './core/mail/mail.module';
import { PdfModule } from './core/pdf/pdf.module';
// Account Module
import { AccountController } from './modules/account/account.controller';
import { AccountService } from './modules/account/account.service';
// Recipe Module
import { RecipeController } from './modules/recipe/controllers/recipe.controller';
import { RecipeService } from './modules/recipe/recipe.service';
// Blog Module
import { BlogController } from './modules/blog/controllers/blog.controller';
import { BlogCommentsController } from './modules/blog/controllers/blog-comments.controller';
import { BlogService } from './modules/blog/blog.service';
// Diet Template Module
import { DietTemplateController } from './modules/diet-template/controllers/diet-template.controller';
import { DietTemplateService } from './modules/diet-template/diet-template.service';
// Member Testimonial Module
import {
  MemberTestimonialController,
} from './modules/member-testimonial/controllers/member-testimonial/member-testimonial.controller';
// Program and Plan Module
import { ProgramController } from './modules/program-and-plan/controllers/program.controller';
import { PlanController } from './modules/program-and-plan/controllers/plan.controller';
import { ProgramService } from './modules/program-and-plan/services/program.service';
import { PlanService } from './modules/program-and-plan/services/plan.service';
// Referrer Module
import { ReferrerController } from './modules/referrer/controllers/referrer.controller';
import { ReferrerService } from './modules/referrer/referrer.service';
// Report Module
import { ContactUsReportController } from './modules/report/controllers/contact-us-report.controller';
import { ContactUsReportService } from './modules/report/contact-us-report.service';
// Pocket Guide Module
import { PocketGuideController } from './modules/pocket-guide/controllers/pocket-guide.controller';
import { PocketGuideService } from './modules/pocket-guide/pocket-guide.service';
// Franchise Module
import { FranchiseController } from './modules/franchise/contollers/franchise.controller';
import { FranchiseService } from './modules/franchise/franchise.service';
// FAQ Module
import { FaqController } from './modules/faq/controllers/faq.controller';
import { FaqService } from './modules/faq/faq.service';
// Admin User Module
import { AdminUserController } from './modules/admin-user/controllers/admin-user.controller';
import { AdminUserService } from './modules/admin-user/admin-user.service';
// Member Module
import { MemberController } from './modules/member/controllers/member.controller';
import { AssessmentController } from './modules/member/controllers/assessment.controller';
import { MemberPocketGuideController } from './modules/member/controllers/member-pocket-guide.controller';
import { MemberCallScheduleController } from './modules/member/controllers/member-call-schedule.controller';
import { MemberIssuesController } from './modules/member/controllers/member-issues.controller';
import { MemberBodyStatsController } from './modules/member/controllers/member-body-stats.controller';
import { MemberHealthIssueController } from './modules/member/controllers/member-health-issue.controller';
import { MemberPaymentController } from './modules/member/controllers/member-payment.controller';
import { MemberDietPlanController } from './modules/member/controllers/member-diet-plan.controller';
import { MemberService } from './modules/member/services/member.service';
import { AssessmentService } from './modules/member/services/assessment.service';
import { MemberCallScheduleService } from './modules/member/services/member-call-schedule.service';
import { MemberPocketGuideService } from './modules/member/services/member-pocket-guide.service';
import { MemberIssuesService } from './modules/member/services/member-issues.service';
import { MemberBodyStatsService } from './modules/member/services/member-body-stats.service';
import { MemberHealthIssueService } from './modules/member/services/member-health-issue.service';
import { MemberPaymentService } from './modules/member/services/member-payment.service';
import { MemberDietPlanService } from './modules/member/services/member-diet-plan.service';
import { MemberDashboardService } from './modules/member/services/member-dashboard.service';
// Data Migration Module
import { RecipeMigrationController } from './modules/data-migration/recipe-migration.controller';
import { MemberMigrationController } from './modules/data-migration/member-migration.controller';
import { BlogMigrationController } from './modules/data-migration/blog-migration.controller';
// Config Parameter Module
import { ConfigParameterController } from './modules/config-parameter/config-parameter.controller';
import { ConfigParameterService } from './modules/config-parameter/config-parameter.service';
// Press Media Module
import { PressMediaController } from './modules/press-media/controllers/press-media.controller';
import { PressMediaService } from './modules/press-media/press-media.service';
// LOV Services
import { BlogAuthorService } from './modules/lov/services/blog-author.service';
import { BlogCategoryService } from './modules/lov/services/blog-category.service';
import { BloodSugarService } from './modules/lov/services/blood-sugar.service';
import { CallPurposeService } from './modules/lov/services/call-purpose.service';
import { CallTypeService } from './modules/lov/services/call-type.service';
import { CountryService } from './modules/lov/services/country.service';
import { EatingHabitService } from './modules/lov/services/eating-habit.service';
import { GenderService } from './modules/lov/services/gender.service';
import { HealthParameterService } from './modules/lov/services/health-parameter.service';
import { LifestyleService } from './modules/lov/services/lifestyle.service';
import { MaritalStatusService } from './modules/lov/services/marital-status.service';
import { NutritiveService } from './modules/lov/services/nutritive.service';
import { RecipeCategoryService } from './modules/lov/services/recipe-category.service';
import { RecipeCuisineService } from './modules/lov/services/recipe-cuisine.service';
import { ReligionService } from './modules/lov/services/religion.service';
import { SleepingPatternService } from './modules/lov/services/sleeping-pattern.service';
import { StateService } from './modules/lov/services/state.service';
import { TypeOfExerciseService } from './modules/lov/services/type-of-exercise.service';
import { UrineOutputService } from './modules/lov/services/urine-output.service';
import { HealthIssuesService } from './modules/lov/services/health-issues.service';
import { FaqCategoryService } from './modules/lov/services/faq-category.service';
import { ProgramCategoryService } from './modules/lov/services/program-category.service';
import { RecipeTypeService } from './modules/lov/services/recipe-type.service';
import { CallStatusService } from './modules/lov/services/call-status.service';
import { HealthParameterUnitService } from './modules/lov/services/health-parameter-unit.service';
import { PaymentModeService } from './modules/lov/services/payment-mode.service';
import { CurrencyService } from './modules/lov/services/currency.service';
import { PaymentStatusService } from './modules/lov/services/payment-status.service';
// LOV Controllers
import { BloodSugarController } from './modules/lov/controllers/blood-sugar.controller';
import { EatingHabitController } from './modules/lov/controllers/eating-habit.controller';
import { GenderController } from './modules/lov/controllers/gender.controller';
import { HealthParameterController } from './modules/lov/controllers/health-parameter.controller';
import { LifestyleController } from './modules/lov/controllers/lifestyle.controller';
import { MaritalStatusController } from './modules/lov/controllers/marital-status.controller';
import { NutritiveController } from './modules/lov/controllers/nutritive.controller';
import { RecipeCategoryController } from './modules/lov/controllers/recipe-category.controller';
import { RecipeCuisineController } from './modules/lov/controllers/recipe-cuisine.controller';
import { ReligionController } from './modules/lov/controllers/religion.controller';
import { SleepingPatternController } from './modules/lov/controllers/sleeping-pattern.controller';
import { TypeOfExerciseController } from './modules/lov/controllers/type-of-exercise.controller';
import { CallTypeController } from './modules/lov/controllers/call-type.controller';
import { CallPurposeController } from './modules/lov/controllers/call-purpose.controller';
import { BlogCategoryController } from './modules/lov/controllers/blog-category.controller';
import { BlogAuthorController } from './modules/lov/controllers/blog-author.controller';
import { CountryController } from './modules/lov/controllers/country.controller';
import { StateController } from './modules/lov/controllers/state.controller';
import { UrineOutputController } from './modules/lov/controllers/urine-output.controller';
import { HealthIssuesController } from './modules/lov/controllers/health-issues.controller';
import { ProgramCategoryController } from './modules/lov/controllers/program-category.controller';
import { FaqCategoryController } from './modules/lov/controllers/faq-category.controller';
import { RecipeTypeController } from './modules/lov/controllers/recipe-type.controller';
import { CurrencyController } from './modules/lov/controllers/currency.controller';
// Core Services
import { EmailService } from './core/mail/email.service';
import { EmailTemplateService } from './core/mail/email-template.service';
import { TransformInterceptor } from './interceptors/transform.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    SequelizeModule.forFeature(ModelList),
    TerminusModule,
    ServeStaticModule.forRoot({
      rootPath: process.env.ASSET_PATH,
      serveRoot: '/media-files',
    }),
    JwtModule.register({
      secret: Env.jwtSecret,
      signOptions: { expiresIn: Env.accessTokenTime as any },
    }),
    PassportModule,
    MailModule,
    forwardRef(() => PdfModule),
  ],
  controllers: [
    AppController,
    CommonController,
    ConfigParametersController,
    HealthController,
    AccountController,
    RecipeController,
    BlogController,
    BlogCommentsController,
    DietTemplateController,
    MemberTestimonialController,
    ProgramController,
    PlanController,
    ReferrerController,
    ContactUsReportController,
    PocketGuideController,
    FranchiseController,
    FaqController,
    AdminUserController,
    MemberController,
    AssessmentController,
    MemberPocketGuideController,
    MemberCallScheduleController,
    MemberIssuesController,
    MemberBodyStatsController,
    MemberHealthIssueController,
    MemberPaymentController,
    MemberDietPlanController,
    RecipeMigrationController,
    MemberMigrationController,
    BlogMigrationController,
    ConfigParameterController,
    PressMediaController,
    // LOV Controllers
    BlogAuthorController,
    BlogCategoryController,
    BloodSugarController,
    CallTypeController,
    CallPurposeController,
    CountryController,
    EatingHabitController,
    FaqCategoryController,
    GenderController,
    HealthIssuesController,
    HealthParameterController,
    LifestyleController,
    MaritalStatusController,
    NutritiveController,
    ProgramCategoryController,
    RecipeCategoryController,
    RecipeCuisineController,
    RecipeTypeController,
    ReligionController,
    SleepingPatternController,
    StateController,
    TypeOfExerciseController,
    UrineOutputController,
    CurrencyController,
  ],
  providers: [
    AppService,
    CommonService,
    ExceptionService,
    AccountService,
    JwtStrategy,
    RecipeService,
    RecipeCategoryService,
    RecipeCuisineService,
    RecipeTypeService,
    BlogService,
    BlogAuthorService,
    BlogCategoryService,
    DietTemplateService,
    ProgramService,
    PlanService,
    ProgramCategoryService,
    ReferrerService,
    ContactUsReportService,
    PocketGuideService,
    FranchiseService,
    FaqService,
    FaqCategoryService,
    AdminUserService,
    MemberService,
    AssessmentService,
    MemberCallScheduleService,
    MemberPocketGuideService,
    MemberIssuesService,
    MemberBodyStatsService,
    MemberHealthIssueService,
    MemberPaymentService,
    MemberDietPlanService,
    MemberDashboardService,
    GenderService,
    MaritalStatusService,
    ReligionService,
    LifestyleService,
    EatingHabitService,
    TypeOfExerciseService,
    SleepingPatternService,
    BloodSugarService,
    UrineOutputService,
    CallTypeService,
    CallPurposeService,
    CallStatusService,
    HealthParameterService,
    HealthParameterUnitService,
    HealthIssuesService,
    PaymentModeService,
    CurrencyService,
    PaymentStatusService,
    NutritiveService,
    StateService,
    CountryService,
    ConfigParameterService,
    PressMediaService,
    EmailService,
    EmailTemplateService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    JwtStrategy,
  ],
  exports: [
    CommonService,
    ExceptionService,
    ReferrerService,
    FranchiseService,
    AdminUserService,
    ProgramService,
    PlanService,
    RecipeService,
    EmailService,
    EmailTemplateService,
    ConfigParameterService,
  ],
})
export class AppModule {
  constructor() {}
}
