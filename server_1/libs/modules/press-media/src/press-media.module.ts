import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ScheduleModule } from '@nestjs/schedule';
import { TxnPressMedia } from './models';
import { modelRegistry } from '@server_1/core';
import { PressMediaController, PublicPressMediaController } from './controllers';
import { PressMediaService } from './services';
// Register models with the model registry
modelRegistry.register([TxnPressMedia]);

@Module({
  imports: [
    SequelizeModule.forFeature([TxnPressMedia]),
    ScheduleModule.forRoot(),
  ],
  controllers: [
    PublicPressMediaController, // Register public controller first to avoid route conflicts
    PressMediaController,
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
