import { Module } from '@nestjs/common';
import { FaqController } from './controllers/faq.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { ModelList } from '../../core/database/db.model-list';
import { ExceptionService } from '../common/exception.service';
import { FaqService } from './faq.service';
import { FaqCategoryService } from '../lov/services/faq-category.service';

@Module({
  imports: [SequelizeModule.forFeature(ModelList)],
  controllers: [FaqController],
  providers: [ExceptionService, FaqService, FaqCategoryService],
  exports: [ExceptionService],
})
export class FaqModule {}
