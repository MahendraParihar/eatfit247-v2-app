import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { modelRegistry } from '@server_1/core';
import { MstIssueCategory, MstIssueStatus } from './models';
import {
  IssueCategoryController,
  IssueStatusController,
  PublicIssueCategoryController,
  PublicIssueStatusController,
} from './controllers';
import { IssueCategoryService, IssueStatusService } from './services';
// Register models with the model registry
// These models have @Scopes decorator, so they MUST be registered for scopes to work
modelRegistry.register([MstIssueCategory, MstIssueStatus]);

@Module({
  imports: [
    SequelizeModule.forFeature([
      MstIssueCategory,
      MstIssueStatus,
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

