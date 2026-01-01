import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { modelRegistry } from '@server_1/core';
import { TxnPromoCode } from './models';
import { PromoCodeService } from './services';
import { PromoCodeController } from './controllers';

// Register TxnPromoCode with model registry
modelRegistry.register([TxnPromoCode]);

@Module({
  imports: [
    SequelizeModule.forFeature([TxnPromoCode]),
  ],
  controllers: [
    PromoCodeController,
  ],
  providers: [
    PromoCodeService,
  ],
  exports: [
    PromoCodeService,
    SequelizeModule,
  ],
})
export class PromoCodeModule {
}

