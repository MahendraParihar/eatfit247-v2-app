import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MstAdminUser, modelRegistry } from '@server/common';
import { TxnPromoCode } from './models';
import { PromoCodeService } from './services';
import { PromoCodeController } from './controllers';

// Register TxnPromoCode with model registry
modelRegistry.register([TxnPromoCode]);

@Module({
  imports: [
    SequelizeModule.forFeature([TxnPromoCode, MstAdminUser]),
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

