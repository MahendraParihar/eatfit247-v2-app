import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { modelRegistry } from '@server_1/core';
import { MstReferrer } from './models';
import { PublicReferrerController, ReferrerController } from './controllers';
import { ReferrerService } from './services';
// Register models with the model registry
// MstReferrer has @Scopes decorator, so it MUST be registered for scopes to work
modelRegistry.register([MstReferrer]);

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
