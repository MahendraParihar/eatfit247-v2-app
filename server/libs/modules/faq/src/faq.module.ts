import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MstFaqCategory, modelRegistry } from '@server/common';
import { TxnFaq } from './models';
import { FaqService, FaqCategoryService } from './services';
import {
  FaqController,
  FaqCategoryController,
} from './controllers/admin';
import { PublicFaqController } from './controllers/public';

// Register TxnFaq with model registry (Mst models are registered in @server/common)
modelRegistry.register([TxnFaq]);

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
