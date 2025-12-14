import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MstAdminUser, MstFranchise } from '@server/common';
import { FranchiseController, PublicFranchiseController } from './controllers';
import { FranchiseService } from './services';

@Module({
  imports: [
    SequelizeModule.forFeature([MstFranchise]),
  ],
  controllers: [
    FranchiseController,
    PublicFranchiseController,
  ],
  providers: [
    FranchiseService,
  ],
  exports: [
    FranchiseService,
    SequelizeModule,
  ],
})
export class FranchiseModule {
}
