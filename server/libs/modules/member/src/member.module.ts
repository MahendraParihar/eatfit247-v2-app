import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import {
  MstAdminUser,
  modelRegistry,
  MstCountry,
  MstPocketGuide,
  MstHealthIssue,
  MstIssueStatus,
  MstIssueCategory,
  MstCallType,
  MstCallPurpose,
  MstCallLogStatus,
} from '@server/common';
import { TxnMember, TxnMemberPocketGuide, TxnMemberHealthIssue, TxnMemberIssue } from './models';
import { MstReferrer } from '@server/common';
import { MstFranchise } from '@server/common';
import {
  MemberController,
  PublicMemberController,
  CallLogController,
} from './controllers';
import {
  MemberService,
  MemberPocketGuideService,
  MemberHealthIssueService,
  MemberCallLogsService,
} from './services';
import { TxnMemberCallLog } from './models';
// Register models with the model registry
modelRegistry.register([
  TxnMember,
  TxnMemberPocketGuide,
  TxnMemberHealthIssue,
  TxnMemberIssue,
  TxnMemberCallLog,
]);

@Module({
  imports: [
    SequelizeModule.forFeature([
      TxnMember,
      TxnMemberPocketGuide,
      TxnMemberHealthIssue,
      TxnMemberIssue,
      TxnMemberCallLog,
      MstReferrer,
      MstFranchise,
      MstCountry,
      MstAdminUser,
      MstPocketGuide,
      MstHealthIssue,
      MstIssueStatus,
      MstIssueCategory,
      MstCallType,
      MstCallPurpose,
      MstCallLogStatus,
    ]),
  ],
  controllers: [
    MemberController,
    PublicMemberController,
    CallLogController,
  ],
  providers: [
    MemberService,
    MemberPocketGuideService,
    MemberHealthIssueService,
    MemberCallLogsService,
  ],
  exports: [
    MemberService,
    SequelizeModule,
  ],
})
export class MemberModule {
}
