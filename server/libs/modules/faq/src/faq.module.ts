import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TxnFaq, MstFaqCategory } from './models';
import { modelRegistry } from '@server/common';
import { FaqService, FaqCategoryService } from './services';
import {
  FaqController,
  FaqCategoryController,
} from './controllers/admin';
import { PublicFaqController } from './controllers/public';

// Register models with the model registry
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
