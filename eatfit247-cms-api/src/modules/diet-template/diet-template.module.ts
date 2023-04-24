import { Module } from '@nestjs/common';
import { DietTemplateController } from './controllers/diet-template.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { ModelList } from '../../core/database/db.model-list';
import { ExceptionService } from '../common/exception.service';
import { DietTemplateService } from './diet-template.service';
import { RecipeCategoryService } from '../lov/services/recipe-category.service';
import { RecipeService } from '../recipe/recipe.service';
import { PdfModule } from 'src/core/pdf/pdf.module';

@Module({
  imports: [SequelizeModule.forFeature(ModelList), PdfModule],
  controllers: [DietTemplateController],
  providers: [ExceptionService, DietTemplateService, RecipeCategoryService, RecipeService],
  exports: [ExceptionService],
})
export class DietTemplateModule {}
