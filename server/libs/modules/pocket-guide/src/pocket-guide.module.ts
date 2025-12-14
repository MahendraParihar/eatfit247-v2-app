import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MstPocketGuide } from './models';
import { modelRegistry } from '@server/common';
import { PocketGuideController, PublicPocketGuideController } from './controllers';
import { PocketGuideService } from './services';

// Register models with the model registry
modelRegistry.register([MstPocketGuide]);

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
