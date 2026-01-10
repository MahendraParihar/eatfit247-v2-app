import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { modelRegistry } from '@server_1/core';
import { MstFaqCategory, TxnFaq } from './models';
import { FaqCategoryService, FaqService } from './services';
import { FaqCategoryController, FaqController, PublicFaqController, PublicFaqCategoryController } from './controllers';
// Register models with the model registry
// These models have @Scopes decorator, so they MUST be registered for scopes to work
modelRegistry.register([TxnFaq, MstFaqCategory]);

@Module({
  imports: [
    SequelizeModule.forFeature([TxnFaq, MstFaqCategory]),
  ],
  controllers: [
    PublicFaqController,
    PublicFaqCategoryController,
    FaqController,
    FaqCategoryController,
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
