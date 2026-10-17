import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { modelRegistry } from '@server_1/core';
import { TxnPromoCode } from './models';
import { PromoCodeService } from './services';

modelRegistry.register([TxnPromoCode]);

/**
 * PromoCodeService without the admin controller, for modules that are also
 * loaded by public-api (e.g. member checkout and payment confirmation).
 */
@Module({
  imports: [SequelizeModule.forFeature([TxnPromoCode])],
  providers: [PromoCodeService],
  exports: [PromoCodeService],
})
export class PromoCodeServiceModule {}
