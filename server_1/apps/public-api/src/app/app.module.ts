import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CommonModule, SentryModule, SentryInterceptor } from '@server_1/core';
import { PlatformModule } from '@server_1/platform';
import { NotificationModule } from '@server_1/modules/notification';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BlogPublicModule } from '@server_1/modules/blogs';
import { BannerPublicModule } from '@server_1/modules/banner';
import { PagesPublicModule } from '@server_1/modules/pages';
import { ReferrerPublicModule } from '@server_1/modules/referrer';
import { PressMediaModule } from '@server_1/modules/press-media';
import { ProgramPlanModule } from '@server_1/modules/program-plan';
import { FaqModule } from '@server_1/modules/faq';
import { MemberModule } from '@server_1/modules/member';
import { LocationModule } from '@server_1/modules/locations';
import { SuccessStoriesModule } from '@server_1/modules/success-stories';
import { ProductPublicModule } from '@server_1/modules/product';
import { ContactModule } from '@server_1/modules/contact';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    // Sentry error tracking
    SentryModule,
    // Rate limiting configuration
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute per IP
      },
    ]),
    PlatformModule.forRoot(),
    // Import feature modules before CommonModule so modelRegistry.register() executes
    BlogPublicModule,
    BannerPublicModule,
    PagesPublicModule,
    ReferrerPublicModule,
    PressMediaModule,
    ProgramPlanModule,
    FaqModule,
    MemberModule,
    LocationModule,
    SuccessStoriesModule,
    ProductPublicModule,
    ContactModule,
    NotificationModule,
    CommonModule.forRoot(['Common', 'Email', 'Google', 'Payment', 'Whatsapp'], PlatformModule.getModels()),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SentryInterceptor,
    },
  ],
})
export class AppModule {}

