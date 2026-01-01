import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TxnFaq, MstFaqCategory } from './models';
import { FaqService, FaqCategoryService } from './services';
import {
  FaqController,
  FaqCategoryController,
} from './controllers/admin';
import { PublicFaqController } from './controllers/public';

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
