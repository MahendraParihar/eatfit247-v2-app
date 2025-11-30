import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MstAdminUser } from '@server/common';
import { MstReferrer } from './models';
import { ReferrerController, PublicReferrerController } from './controllers';
import { ReferrerService } from './services';

@Module({
  imports: [
    SequelizeModule.forFeature([MstReferrer, MstAdminUser]),
  ],
  controllers: [
    ReferrerController,
    PublicReferrerController,
  ],
  providers: [
    ReferrerService,
  ],
  exports: [
    ReferrerService,
    SequelizeModule,
  ],
})
export class ReferrerModule {
}
