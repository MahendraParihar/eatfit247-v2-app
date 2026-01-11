import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TxnBanner } from './models';
import { modelRegistry } from '@server_1/core';
import { PublicBannerController } from './controllers';
import { BannerService } from './services';

// Register models with the model registry
modelRegistry.register([TxnBanner]);

/**
 * Public-only Banner Module
 * Only includes the public controller
 */
@Module({
  imports: [
    SequelizeModule.forFeature([TxnBanner]),
  ],
  controllers: [
    PublicBannerController,
  ],
  providers: [
    BannerService,
  ],
  exports: [
    BannerService,
    SequelizeModule,
  ],
})
export class BannerPublicModule {
}

