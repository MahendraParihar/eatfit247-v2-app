import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MstPocketGuide } from '@server/common';
import { PocketGuideController, PublicPocketGuideController } from './controllers';
import { PocketGuideService } from './services';

// Models are registered in @server/common module

@Module({
  imports: [
    SequelizeModule.forFeature([MstPocketGuide]),
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
