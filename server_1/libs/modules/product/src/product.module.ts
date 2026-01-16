import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TxnProduct } from './models';
import { modelRegistry } from '@server_1/core';
import { ProductController, PublicProductController, WooCommerceController } from './controllers';
import { ProductService } from './services';
// Register models with the model registry
modelRegistry.register([TxnProduct]);

@Module({
  imports: [SequelizeModule.forFeature([TxnProduct])],
  controllers: [ProductController, PublicProductController, WooCommerceController],
  providers: [ProductService],
  exports: [ProductService, SequelizeModule],
})
export class ProductModule {}

