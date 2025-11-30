import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MstAdminUser } from '@server/common';
import { MstPocketGuide } from './models';
import { PocketGuideController, PublicPocketGuideController } from './controllers';
import { PocketGuideService } from './services';

@Module({
  imports: [
    SequelizeModule.forFeature([MstPocketGuide, MstAdminUser]),
  ],
  controllers: [
    PocketGuideController,
    PublicPocketGuideController,
  ],
  providers: [
    PocketGuideService,
  ],
  exports: [
    PocketGuideService,
    SequelizeModule,
  ],
})
export class PocketGuideModule {
}
