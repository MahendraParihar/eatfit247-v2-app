import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TxnBanner } from './models';
import { modelRegistry } from '@server_1/core';
import { BannerController } from './controllers';
import { BannerService } from './services';

// Register models with the model registry
modelRegistry.register([TxnBanner]);

@Module({
  imports: [
    SequelizeModule.forFeature([TxnBanner]),
  ],
  controllers: [
    BannerController,
  ],
  providers: [
    BannerService,
  ],
  exports: [
    BannerService,
    SequelizeModule,
  ],
})
export class BannerModule {
}
