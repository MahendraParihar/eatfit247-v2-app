import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { modelRegistry } from '@server_1/core';
import { TxnFaq, MstFaqCategory } from './models';
import { FaqService, FaqCategoryService } from './services';
import {
  FaqController,
  FaqCategoryController,
} from './controllers/admin';
import { PublicFaqController } from './controllers/public';

// Register models with the model registry
// These models have @Scopes decorator, so they MUST be registered for scopes to work
modelRegistry.register([TxnFaq, MstFaqCategory]);

@Module({
  imports: [
    SequelizeModule.forFeature([TxnFaq, MstFaqCategory]),
  ],
  controllers: [
    FaqController,
    FaqCategoryController,
    PublicFaqController,
  ],
  providers: [
    FaqService,
    FaqCategoryService,
  ],
  exports: [
    FaqService,
    FaqCategoryService,
    SequelizeModule,
  ],
})
export class FaqModule {
}
