import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MstAdminUser, modelRegistry } from '@server/common';
import { MstIssueCategory, MstIssueStatus } from './models';
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

// Register models with the model registry
modelRegistry.register([MstIssueCategory, MstIssueStatus]);

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

