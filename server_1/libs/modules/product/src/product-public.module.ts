import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TxnProduct } from './models';
import { modelRegistry } from '@server_1/core';
import { PublicProductController } from './controllers';
import { ProductService } from './services';
// Register models with the model registry
modelRegistry.register([TxnProduct]);

/**
 * Public-only Product Module
 * Only includes the public controller
 */
@Module({
  imports: [SequelizeModule.forFeature([TxnProduct])],
  controllers: [PublicProductController],
  providers: [ProductService],
  exports: [ProductService, SequelizeModule],
})
export class ProductPublicModule {
}

