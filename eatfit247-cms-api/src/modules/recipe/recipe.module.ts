import { Module } from '@nestjs/common';
import { RecipeController } from './controllers/recipe.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { ModelList } from '../../core/database/db.model-list';
import { ExceptionService } from '../common/exception.service';
import { RecipeService } from './recipe.service';
import { RecipeCategoryService } from '../lov/services/recipe-category.service';
import { RecipeCuisineService } from '../lov/services/recipe-cuisine.service';
import { RecipeTypeService } from '../lov/services/recipe-type.service';
import { PdfModule } from 'src/core/pdf/pdf.module';

@Module({
  imports: [SequelizeModule.forFeature(ModelList), PdfModule],
  controllers: [RecipeController],
  providers: [ExceptionService, RecipeService, RecipeCategoryService, RecipeCuisineService, RecipeTypeService],
  exports: [ExceptionService, RecipeService],
})
export class RecipeModule {}
