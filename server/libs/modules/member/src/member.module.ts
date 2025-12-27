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
  MstHealthParameter,
  MstHealthParameterUnit,
} from '@server/common';
import { TxnMember, TxnMemberPocketGuide, TxnMemberHealthIssue, TxnMemberIssue, TxnMemberHealthParameterLog, TxnMemberHealthParameter } from './models';
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
  MemberHealthParameterLogsService,
  MemberIssueService,
} from './services';
import { TxnMemberCallLog } from './models';
// Register models with the model registry
modelRegistry.register([
  TxnMember,
  TxnMemberPocketGuide,
  TxnMemberHealthIssue,
  TxnMemberIssue,
  TxnMemberCallLog,
  TxnMemberHealthParameterLog,
  TxnMemberHealthParameter,
]);

@Module({
  imports: [
    SequelizeModule.forFeature([
      TxnMember,
      TxnMemberPocketGuide,
      TxnMemberHealthIssue,
      TxnMemberIssue,
      TxnMemberCallLog,
      TxnMemberHealthParameterLog,
      TxnMemberHealthParameter,
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
      MstHealthParameter,
      MstHealthParameterUnit,
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
    MemberHealthParameterLogsService,
    MemberIssueService,
  ],
  exports: [
    MemberService,
    SequelizeModule,
  ],
})
export class MemberModule {
}
