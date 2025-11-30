import { Module } from '@nestjs/common';
import { CommonModule } from '@server/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from '../../../libs/modules/auth';
import { BlogsModule } from '../../../libs/modules/blogs';
import { FaqModule } from '../../../libs/modules/faq';
import { PressMediaModule } from '../../../libs/modules/press-media';
import { LegalPagesModule } from '../../../libs/modules/pages';
import { ProgramPlanModule } from '../../../libs/modules/program-plan';
import { RecipeModule } from '../../../libs/modules/recipe';
import { ReferrerModule } from '../../../libs/modules/referrer';
import { FranchiseModule } from '../../../libs/modules/franchise';
import { PocketGuideModule } from '../../../libs/modules/pocket-guide';
import { CallLogsModule } from '../../../libs/modules/call-logs';
import { AssessmentMasterModule } from '../../../libs/modules/assessment-master';
import { LocationModule } from '../../../libs/modules/locations';
import { MemberModule } from '../../../libs/modules/member';
import { AdminUserModule } from '../../../libs/modules/admin-user';
import { EmailModule } from '../../../libs/modules/email';
import { IssuesModule } from '../../../libs/modules/issues';

@Module({
  imports: [
    CommonModule.forRoot([]),
    AuthModule,
    BlogsModule,
    FaqModule,
    PressMediaModule,
    LegalPagesModule,
    ProgramPlanModule,
    RecipeModule,
    ReferrerModule,
    FranchiseModule,
    PocketGuideModule,
    CallLogsModule,
    AssessmentMasterModule,
    LocationModule,
    MemberModule,
    AdminUserModule,
    EmailModule,
    IssuesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
}

