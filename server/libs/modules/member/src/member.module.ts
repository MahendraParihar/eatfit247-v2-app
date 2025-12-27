import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MstAdminUser, modelRegistry, MstCountry, MstPocketGuide, MstHealthIssue, MstIssueStatus, MstIssueCategory } from '@server/common';
import { TxnMember, TxnMemberPocketGuide, TxnMemberHealthIssue, TxnMemberIssue } from './models';
import { MstReferrer } from '@server/common';
import { MstFranchise } from '@server/common';
import {
  MemberController,
  PublicMemberController,
} from './controllers';
import {
  MemberService,
} from './services';
// Register models with the model registry
modelRegistry.register([TxnMember, TxnMemberPocketGuide, TxnMemberHealthIssue, TxnMemberIssue]);

@Module({
  imports: [
    SequelizeModule.forFeature([
      TxnMember,
      TxnMemberPocketGuide,
      TxnMemberHealthIssue,
      TxnMemberIssue,
      MstReferrer,
      MstFranchise,
      MstCountry,
      MstAdminUser,
      MstPocketGuide,
      MstHealthIssue,
      MstIssueStatus,
      MstIssueCategory,
    ]),
  ],
  controllers: [
    MemberController,
    PublicMemberController,
  ],
  providers: [
    MemberService,
  ],
  exports: [
    MemberService,
    SequelizeModule,
  ],
})
export class MemberModule {
}
