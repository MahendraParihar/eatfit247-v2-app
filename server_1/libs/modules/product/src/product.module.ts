import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { modelRegistry } from '@server_1/core';
import { ProductController, PublicProductController } from './controllers';
import { ProductService } from './services';
import { MstProduct } from '@server_1/models/product';
// Register models with the model registry
modelRegistry.register([MstProduct]);

@Module({
  imports: [SequelizeModule.forFeature([MstProduct])],
  controllers: [ProductController, PublicProductController],
  providers: [ProductService],
  exports: [ProductService, SequelizeModule],
})
export class ProductModule {}

