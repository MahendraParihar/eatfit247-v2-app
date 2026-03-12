import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { modelRegistry } from '@server_1/core';
import { ProductController } from './controllers';
import { ProductService } from './services';
import {
  MstProduct,
  MstProductPrice,
  MstProductVariant,
} from '@server_1/models/product';
// Register models with the model registry
modelRegistry.register([MstProduct, MstProductVariant, MstProductPrice]);

/**
 * Admin-only Product Module
 * Only includes the admin controller
 */
@Module({
  imports: [SequelizeModule.forFeature([MstProduct, MstProductVariant, MstProductPrice])],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService, SequelizeModule],
})
export class ProductAdminModule {
}

