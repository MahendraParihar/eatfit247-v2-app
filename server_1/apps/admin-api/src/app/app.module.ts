import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { CommonModule, Env } from '@server_1/core';
import { PlatformModule } from '@server_1/platform';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// Import modules first so their modelRegistry.register() calls execute before CommonModule.forRoot()
import { AuthModule } from '@server_1/modules/auth';
import { MemberModule } from '@server_1/modules/member';
import { AssessmentModule } from '@server_1/modules/assessment';
import { ProgramPlanModule } from '@server_1/modules/program-plan';
import { CallLogsModule } from '@server_1/modules/call-logs';
import { TaxEngineModule } from '@server_1/modules/tax-engine';
import { PaymentModule } from '@server_1/modules/payment';
import { BlogModule } from '@server_1/modules/blogs';
import { FaqModule } from '@server_1/modules/faq';
import { PressMediaModule } from '@server_1/modules/press-media';
import { LegalPagesModule } from '@server_1/modules/pages';
import { RecipeModule } from '@server_1/modules/recipe';
import { ReferrerModule } from '@server_1/modules/referrer';
import { FranchiseModule } from '@server_1/modules/franchise';
import { LocationModule } from '@server_1/modules/locations';
import { IssuesModule } from '@server_1/modules/issues';
import { PocketGuideModule } from '@server_1/modules/pocket-guide';
import { DietModule } from '@server_1/modules/diet';
import { GoogleCalendarModule } from '@server_1/modules/google-calendar/src';
import { PromoCodeModule } from '@server_1/modules/promo-code';
import { BannerModule } from '@server_1/modules/banner';
import { MemberTestimonialModule } from '@server_1/modules/member-testimonial';
import { LovsModule } from '@server_1/modules/lovs';
import { AdminUserModule } from '@server_1/admin-only/admin-user';
import { ReportsModule } from '@server_1/admin-only/reports';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: Env.persistentStorageAssetPath,
      serveRoot: '/media-files',
    }),
    PlatformModule.forRoot(),
    // Import feature modules before CommonModule so modelRegistry.register() executes
    AuthModule,
    MemberModule,
    AssessmentModule,
    ProgramPlanModule,
    CallLogsModule,
    TaxEngineModule,
    PaymentModule,
    BlogModule,
    FaqModule,
    PressMediaModule,
    LegalPagesModule,
    RecipeModule,
    ReferrerModule,
    FranchiseModule,
    LocationModule,
    IssuesModule,
    PocketGuideModule,
    DietModule,
    GoogleCalendarModule,
    PromoCodeModule,
    BannerModule,
    MemberTestimonialModule,
    LovsModule,
    AdminUserModule,
    ReportsModule,
    CommonModule.forRoot(
      ['Common', 'Email', 'Google', 'Calendar', 'RazorPay'],
      PlatformModule.getModels(),
    ),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
}

