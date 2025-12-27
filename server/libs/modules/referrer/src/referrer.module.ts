import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MstReferrer } from '@server/common';
import { ReferrerController, PublicReferrerController } from './controllers';
import { ReferrerService } from './services';

// Models are registered in @server/common module

@Module({
  imports: [
    SequelizeModule.forFeature([MstReferrer]),
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
