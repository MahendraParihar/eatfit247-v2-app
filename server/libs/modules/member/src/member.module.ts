import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MstAdminUser, modelRegistry, MstCountry } from '@server/common';
import { TxnMember } from './models';
import { MstReferrer } from '../../referrer';
import { MstFranchise } from '@server/common';
import {
  MemberController,
  PublicMemberController,
} from './controllers';
import {
  MemberService,
} from './services';
// Register models with the model registry
modelRegistry.register([TxnMember]);

@Module({
  imports: [
    SequelizeModule.forFeature([
      TxnMember,
      MstReferrer,
      MstFranchise,
      MstCountry,
      MstAdminUser,
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
