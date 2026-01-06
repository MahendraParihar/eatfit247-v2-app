import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { modelRegistry } from '@server_1/core';
import {
  MstRecipe,
  MstRecipeCategory,
  MstRecipeCategoryMapping,
  MstRecipeCuisine,
  MstRecipeCuisineMapping,
  MstRecipeNutritive,
  MstRecipeType,
} from './models';
import {
  RecipeCategoryController,
  RecipeController,
  RecipeCuisineController,
  RecipeTypeController,
} from './controllers';
import { RecipeCategoryService, RecipeCuisineService, RecipeService, RecipeTypeService } from './services';
// Register models with the model registry
// Models with @Scopes decorator MUST be registered for scopes to work
// Models used in scopes (like MstRecipeCategoryMapping and MstRecipeCuisineMapping) also need to be registered
modelRegistry.register([
  MstRecipeCategory,
  MstRecipeCuisine,
  MstRecipeType,
  MstRecipe,
  MstRecipeCategoryMapping,
  MstRecipeCuisineMapping,
]);

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
    ]),
  ],
  controllers: [
    RecipeCategoryController,
    RecipeCuisineController,
    RecipeTypeController,
    RecipeController,
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
