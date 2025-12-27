import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import {
  MstAdminUser,
  MstRecipeCategory,
  MstRecipeCuisine,
  MstRecipeType,
  MstRecipe,
  MstRecipeCategoryMapping,
  MstRecipeCuisineMapping,
  MstRecipeNutritive,
} from '@server/common';
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

// Models are registered in @server/common module

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
