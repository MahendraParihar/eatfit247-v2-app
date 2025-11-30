import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MstAdminUser } from '@server/common';
import {
  MstRecipeCategory,
  MstRecipeCuisine,
  MstRecipeType,
  MstRecipe,
  MstRecipeCategoryMapping,
  MstRecipeCuisineMapping,
  MstRecipeNutritive,
} from './models';
import {
  RecipeCategoryController,
  RecipeCuisineController,
  RecipeTypeController,
  RecipeController,
  PublicRecipeController,
} from './controllers';
import {
  RecipeCategoryService,
  RecipeCuisineService,
  RecipeTypeService,
  RecipeService,
} from './services';

@Module({
  imports: [
    SequelizeModule.forFeature([
      MstRecipeCategory,
      MstRecipeCuisine,
      MstRecipeType,
      MstRecipe,
      MstRecipeCategoryMapping,
      MstRecipeCuisineMapping,
      MstRecipeNutritive,
      MstAdminUser,
    ]),
  ],
  controllers: [
    RecipeCategoryController,
    RecipeCuisineController,
    RecipeTypeController,
    RecipeController,
    PublicRecipeController,
  ],
  providers: [
    RecipeCategoryService,
    RecipeCuisineService,
    RecipeTypeService,
    RecipeService,
  ],
  exports: [
    RecipeCategoryService,
    RecipeCuisineService,
    RecipeTypeService,
    RecipeService,
    SequelizeModule,
  ],
})
export class RecipeModule {
}
