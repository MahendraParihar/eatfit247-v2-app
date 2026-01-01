import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
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

