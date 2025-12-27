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
  MstGender,
  MstMaritalStatus,
  MstReligion,
  MstLifestyle,
  MstEatingHabit,
  MstTypeOfExercise,
  MstSleepingPattern,
  MstBloodSugar,
  MstUrineOutput,
  TxnAddress,
} from '@server/common';
import { TxnMember, TxnMemberPocketGuide, TxnMemberHealthIssue, TxnMemberIssue, TxnMemberHealthParameterLog, TxnMemberHealthParameter, TxnAssessment } from './models';
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
  MemberAssessmentService,
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
  TxnAssessment,
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
      TxnAssessment,
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
      MstGender,
      MstMaritalStatus,
      MstReligion,
      MstLifestyle,
      MstEatingHabit,
      MstTypeOfExercise,
      MstSleepingPattern,
      MstBloodSugar,
      MstUrineOutput,
      TxnAddress,
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
    MemberAssessmentService,
  ],
  exports: [
    MemberService,
    SequelizeModule,
  ],
})
export class MemberModule {
}
