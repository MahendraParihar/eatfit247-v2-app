import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MstAdminUser } from '@server/common';
import { TxnMember } from './models';
import { MstReferrer } from '../../referrer/src/models/mst-referrer.model';
import { MstFranchise } from '../../../common/src/models/mst-franchise.model';
import { MstCountry } from '../../locations/src/models/mst-country.model';
import {
  MemberController,
  PublicMemberController,
} from './controllers';
import {
  MemberService,
} from './services';

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
