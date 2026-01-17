import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MstProduct } from './models';
import { modelRegistry } from '@server_1/core';
import { ProductController, WooCommerceController } from './controllers';
import { ProductService } from './services';
// Register models with the model registry
modelRegistry.register([MstProduct]);

/**
 * Admin-only Product Module
 * Only includes the admin controller
 */
@Module({
  imports: [SequelizeModule.forFeature([MstProduct])],
  controllers: [ProductController, WooCommerceController],
  providers: [ProductService],
  exports: [ProductService, SequelizeModule],
})
export class ProductAdminModule {
}

