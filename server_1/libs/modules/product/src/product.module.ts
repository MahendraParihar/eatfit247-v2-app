import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MstProduct } from './models';
import { modelRegistry } from '@server_1/core';
import { ProductController, PublicProductController } from './controllers';
import { ProductService } from './services';
// Register models with the model registry
modelRegistry.register([MstProduct]);

@Module({
  imports: [SequelizeModule.forFeature([MstProduct])],
  controllers: [ProductController, PublicProductController],
  providers: [ProductService],
  exports: [ProductService, SequelizeModule],
})
export class ProductModule {}

