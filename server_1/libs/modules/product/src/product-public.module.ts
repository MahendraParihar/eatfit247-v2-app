import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MstProduct } from './models';
import { modelRegistry } from '@server_1/core';
import { PublicProductController } from './controllers';
import { ProductService } from './services';
// Register models with the model registry
modelRegistry.register([MstProduct]);

/**
 * Public-only Product Module
 * Only includes the public controller
 */
@Module({
  imports: [SequelizeModule.forFeature([MstProduct])],
  controllers: [PublicProductController],
  providers: [ProductService],
  exports: [ProductService, SequelizeModule],
})
export class ProductPublicModule {}

