import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MstAdminUser, modelRegistry, MstIssueCategory, MstIssueStatus } from '@server/common';
import {
  IssueCategoryController,
  IssueStatusController,
  PublicIssueCategoryController,
  PublicIssueStatusController,
} from './controllers';
import {
  IssueCategoryService,
  IssueStatusService,
} from './services';

// Models are registered in @server/common module

@Module({
  imports: [
    SequelizeModule.forFeature([
      MstIssueCategory,
      MstIssueStatus,
      MstAdminUser,
    ]),
  ],
  controllers: [
    IssueCategoryController,
    IssueStatusController,
    PublicIssueCategoryController,
    PublicIssueStatusController,
  ],
  providers: [
    IssueCategoryService,
    IssueStatusService,
  ],
  exports: [
    IssueCategoryService,
    IssueStatusService,
    SequelizeModule,
  ],
})
export class IssuesModule {
}

