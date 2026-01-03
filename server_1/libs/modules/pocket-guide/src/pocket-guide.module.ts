import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { modelRegistry } from '@server_1/core';
import { MstPocketGuide } from './models';
import { PocketGuideController, PublicPocketGuideController } from './controllers';
import { PocketGuideService } from './services';

// Register models with the model registry
// MstPocketGuide has @Scopes decorator, so it MUST be registered for scopes to work
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
