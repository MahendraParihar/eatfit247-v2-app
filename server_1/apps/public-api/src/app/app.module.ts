import { Module } from '@nestjs/common';
import { CommonModule } from '@server_1/core';
import { PlatformModule } from '@server_1/platform';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BlogModule } from '@server_1/modules/blogs';
import { BannerModule } from '@server_1/modules/banner';
import { LegalPagesModule } from '@server_1/modules/pages';
import { ReferrerModule } from '@server_1/modules/referrer';
import { PressMediaModule } from '@server_1/modules/press-media';
import { ProgramPlanModule } from '@server_1/modules/program-plan';
import { FaqModule } from '@server_1/modules/faq';
import { MemberModule } from '@server_1/modules/member';
import { LocationModule } from '@server_1/modules/locations';
import { SuccessStoriesModule } from '@server_1/modules/success-stories';

@Module({
  imports: [
    PlatformModule.forRoot(),
    // Import feature modules before CommonModule so modelRegistry.register() executes
    BlogModule,
    BannerModule,
    LegalPagesModule,
    ReferrerModule,
    PressMediaModule,
    ProgramPlanModule,
    FaqModule,
    MemberModule,
    LocationModule,
    SuccessStoriesModule,
    CommonModule.forRoot(['Common', 'Email'], PlatformModule.getModels()),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
}

