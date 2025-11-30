import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MstAdminUser } from '@server/common';
import { TxnPressMedia } from './models';
import { PressMediaController, PublicPressMediaController } from './controllers';
import { PressMediaService } from './services';

@Module({
  imports: [
    SequelizeModule.forFeature([TxnPressMedia, MstAdminUser]),
  ],
  controllers: [
    PressMediaController,
    PublicPressMediaController,
  ],
  providers: [
    PressMediaService,
  ],
  exports: [
    PressMediaService,
    SequelizeModule,
  ],
})
export class PressMediaModule {
}
