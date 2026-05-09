import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CommonModule, Env } from '@server_1/core';
import { PlatformModule } from '@server_1/platform';
import { NotificationModule } from '@server_1/modules/notification';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// Import modules first so their modelRegistry.register() calls execute before CommonModule.forRoot()
import { MemberModule } from '@server_1/modules/member';
import { AssessmentModule } from '@server_1/modules/assessment';
import { ProgramPlanModule } from '@server_1/modules/program-plan';
import { CallLogsModule } from '@server_1/modules/call-logs';
import { ContactModule } from '@server_1/modules/contact';
import { TaxEngineModule } from '@server_1/modules/tax-engine';
import { PaymentModule } from '@server_1/modules/payment';
import { BlogAdminModule } from '@server_1/modules/blogs';
import { FaqModule } from '@server_1/modules/faq';
import { PressMediaModule } from '@server_1/modules/press-media';
import { RecipeModule } from '@server_1/modules/recipe';
import { ReferrerAdminModule } from '@server_1/modules/referrer';
import { FranchiseModule } from '@server_1/modules/franchise';
import { LocationModule } from '@server_1/modules/locations';
import { IssuesModule } from '@server_1/modules/issues';
import { PocketGuideModule } from '@server_1/modules/pocket-guide';
import { DietModule } from '@server_1/modules/diet';
import { GoogleCalendarModule } from '@server_1/modules/google-calendar/src';
import { PromoCodeModule } from '@server_1/modules/promo-code';
import { BannerAdminModule } from '@server_1/modules/banner';
import { MemberTestimonialModule } from '@server_1/modules/member-testimonial';
import { LovsModule } from '@server_1/modules/lovs';
import { SuccessStoriesModule } from '@server_1/modules/success-stories';
import { AdminUserModule } from '@server_1/admin-only/admin-user';
import { ReportsModule } from '@server_1/admin-only/reports';
import { ProductAdminModule } from '@server_1/modules/product';
import { PagesAdminModule } from '@server_1/modules/pages';
import { DeliveryModule } from '@server_1/modules/delivery';
import { AppointmentModule } from '@server_1/modules/appointment';
import { AuthModule } from '@server_1/modules/auth';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    // Rate limiting configuration
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute per IP
      },
    ]),
    ServeStaticModule.forRoot({
      rootPath: Env.persistentStorageAssetPath,
      serveRoot: '/media-files',
    }),
    PlatformModule.forRoot(),
    // Import feature modules before CommonModule so modelRegistry.register() executes
    MemberModule,
    AssessmentModule,
    ProgramPlanModule,
    CallLogsModule,
    ContactModule,
    TaxEngineModule,
    PaymentModule,
    BlogAdminModule,
    FaqModule,
    PressMediaModule,
    PagesAdminModule,
    RecipeModule,
    ReferrerAdminModule,
    FranchiseModule,
    LocationModule,
    IssuesModule,
    PocketGuideModule,
    DietModule,
    GoogleCalendarModule,
    PromoCodeModule,
    BannerAdminModule,
    MemberTestimonialModule,
    LovsModule,
    SuccessStoriesModule,
    ProductAdminModule,
    DeliveryModule,
    AppointmentModule,
    NotificationModule,
    CommonModule.forRoot(
      ['Common', 'Email', 'Google', 'Calendar', 'Payment', 'Invoice', 'Whatsapp'],
      PlatformModule.getModels(),
    ),
    AuthModule,
    AdminUserModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

