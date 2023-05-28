import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './core/database/database.module';
import { APP_FILTER } from '@nestjs/core';
import { join } from 'path';
import { AllExceptionsFilter } from './http-exception.filter';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AccountModule } from './modules/account/account.module';
import { CommonModule } from './modules/common/common.module';
import { RecipeModule } from './modules/recipe/recipe.module';
import { DietTemplateModule } from './modules/diet-template/diet-template.module';
import { BlogModule } from './modules/blog/blog.module';
import { MemberTestimonialModule } from './modules/member-testimonial/member-testimonial.module';
import { ProgramAndPlanModule } from './modules/program-and-plan/program-and-plan.module';
import { ReferrerModule } from './modules/referrer/referrer.module';
import { ReportModule } from './modules/report/report.module';
import { LovModule } from './modules/lov/lov.module';
import { PocketGuideModule } from './modules/pocket-guide/pocket-guide.module';
import { FranchiseModule } from './modules/franchise/franchise.module';
import { FaqModule } from './modules/faq/faq.module';
import { AdminUserModule } from './modules/admin-user/admin-user.module';
import { MemberModule } from './modules/member/member.module';
import { DataMigrationModule } from './modules/data-migration/data-migration.module';
import { ConfigParameterModule } from './modules/config-parameter/config-parameter.module';
import { MailModule } from './core/mail/mail.module';
import { PdfModule } from './core/pdf/pdf.module';
import { CommonFunctionsUtil } from './util/common-functions-util';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env', isGlobal: true }),
    DatabaseModule,
    AccountModule,
    CommonModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '../media-files'), // added ../ to get one folder back
      serveRoot: '/media-files/', //last slash was important
    }),
    MemberModule,
    RecipeModule,
    DietTemplateModule,
    BlogModule,
    MemberTestimonialModule,
    ProgramAndPlanModule,
    ReferrerModule,
    ReportModule,
    LovModule,
    PocketGuideModule,
    FranchiseModule,
    FaqModule,
    AdminUserModule,
    DataMigrationModule,
    ConfigParameterModule,
    MailModule,
    PdfModule,
  ],
  controllers: AppModule.getControllers(),
  providers: AppModule.getProviders(),
})
export class AppModule {

  constructor() {
  }

  /**
   * Keep Adding Controller List here
   * @returns Array
   */
  static getControllers(): any[] {
    return [];
  }

  /**
   * Keep Adding Future Providers / Services here
   * @returns Array
   */
  static getProviders(): any[] {
    return [
      {
        provide: APP_FILTER,
        useClass: AllExceptionsFilter,
      },
    ];
  }
}
