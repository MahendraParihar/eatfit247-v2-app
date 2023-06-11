import { InjectModel } from '@nestjs/sequelize';
import { MstRecipe } from '../../core/database/models/mst-recipe.model';
import { MstRecipeCategoryMapping } from '../../core/database/models/mst-recipe-category-mapping.model';
import { MstRecipeCuisineMapping } from '../../core/database/models/mst-recipe-cuisine-mapping.model';
import { MstRecipeNutritive } from '../../core/database/models/mst-recipe-nutritive.model';
import { Controller, Get } from '@nestjs/common';
import { CommonFunctionsUtil } from '../../util/common-functions-util';
import { Sequelize } from 'sequelize-typescript';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { RecipeService } from '../recipe/recipe.service';
import { MstRecipeType } from '../../core/database/models/mst-recipe-type.model';;

@Controller('migration')
export class RecipeMigrationController {
  folderPath = '/Users/mahendraparihar/Projects/EatFit247/Migration/mst_recipe.json';

  constructor(
    @InjectModel(MstRecipe) private readonly recipeRepository: typeof MstRecipe,
    @InjectModel(MstRecipeCategoryMapping) private readonly recipeCategoryRepository: typeof MstRecipeCategoryMapping,
    @InjectModel(MstRecipeCuisineMapping) private readonly recipeCuisineRepository: typeof MstRecipeCuisineMapping,
    @InjectModel(MstRecipeNutritive) private readonly recipeNutritiveRepository: typeof MstRecipeNutritive,
    private sequelize: Sequelize,
    private recipeService: RecipeService,
  ) {
  }

  @Get('recipe')
  async init() {
    const t = await this.sequelize.transaction();
    try {
      const recipeList = [];
      const recipeCategoryList = [];
      const recipeCuisineList = [];
      const recipeNutritiveList = [];
      const data = JSON.parse(readFileSync(resolve(`${this.folderPath}`), 'utf8'));
      for (const s of data) {
        const imagePath = s.image_path.replace('recipe_images', '');
        recipeList.push({
          recipeId: Number(s.id),
          name: s.name,
          recipeTypeId: Number(s.is_veg) === 1 ? 1 : 2,
          details: s.details,
          benefits: s.benefits,
          isVeg: Number(s.is_veg) === 1,
          imagePath: [
            {
              size: 227093,
              webUrl: 'media-files/recipe' + imagePath,
              encoding: '7bit',
              fileName: imagePath,
              mimetype: 'image/jpeg',
              fieldName: 'file',
              originalName: s.name + '.jpg',
            },
          ],
          url: CommonFunctionsUtil.removeSpecialChar(s.name.toString().toLowerCase(), '-'),
          ingredient: this.getIng(s.ingredient_json),
          howToMake: this.getMethod(s.method_json),
          visitedCount: s.visited_count ? Number(s.visited_count) : null,
          servingCount: s.serving_count ? Number(s.serving_count) : null,
          shareCount: s.share_count ? Number(s.share_count) : null,
          tags: s.name,
          isVisibleToAll: Number(s.is_visible_to_all),
          createdBy: 1,
          modifiedBy: 1,
          createdIp: ':0',
          modifiedIp: ':0',
        });
        recipeCategoryList.push({
          recipeId: s.id,
          recipeCategoryId: s.recipe_category_id,
          createdBy: 1,
          modifiedBy: 1,
          createdIp: ':0',
          modifiedIp: ':0',
        });
        recipeCuisineList.push({
          recipeId: s.id,
          recipeCuisineId: s.recipe_cuisine_id,
          createdBy: 1,
          modifiedBy: 1,
          createdIp: ':0',
          modifiedIp: ':0',
        });
      }
      await this.sequelize.query(`truncate table mst_recipe_cuisine_mappings restart identity CASCADE`);
      await this.sequelize.query(`truncate table mst_recipe_category_mappings restart identity CASCADE`);
      await this.sequelize.query(`truncate table mst_recipes restart identity CASCADE`);
      await this.recipeRepository.bulkCreate(recipeList);
      await this.recipeCategoryRepository.bulkCreate(recipeCategoryList);
      await this.recipeCuisineRepository.bulkCreate(recipeCuisineList);
      await this.sequelize.query(
        `SELECT SETVAL('mst_recipe_cuisine_mappings_recipe_cuisine_mapping_id_seq',
                       (SELECT MAX(recipe_cuisine_mapping_id) + 1 FROM mst_recipe_cuisine_mappings));`,
      );
      await this.sequelize.query(
        `SELECT SETVAL('mst_recipe_category_mappings_recipe_category_mapping_id_seq',
                       (SELECT MAX(recipe_category_mapping_id) + 1 FROM mst_recipe_category_mappings));`,
      );
      await this.sequelize.query(
        `SELECT SETVAL('mst_recipes_recipe_id_seq',
                       (SELECT MAX(recipe_id) + 1 FROM mst_recipes));`,
      );
      await t.commit();
    } catch (e) {

      await t.rollback();
    }
  }

  getIng(ingJson): string {
    const tempJson = [];
    let itemSection = { headerText: null, items: [] };
    ingJson = JSON.parse(ingJson);
    for (const s of ingJson) {
      if (s.is_header === 1 || s.is_header === '1') {
        if (itemSection.items.length > 0) {
          tempJson.push(itemSection);
          itemSection = { headerText: null, items: [] };
        }
        itemSection.headerText = this.replaceExtraChar(s.value);
      } else {
        itemSection.items.push(this.replaceExtraChar(s.value));
      }
    }

    tempJson.push(itemSection);
    let temp = '';
    for (let i = 0; i < tempJson.length; i++) {
      if (i === 0) {
        temp = temp + (tempJson[i].headerText ? `<b>${this.replaceExtraChar(tempJson[i].headerText)}</b>` : '');
        if (tempJson[i].items.length > 0) {
          temp = temp + `<ul>`;
          for (const ti of tempJson[i].items) {
            temp = temp + `<li>${this.replaceExtraChar(ti)}</li>`;
          }
          temp = temp + `</ul>`;
        }
      } else {
        temp = temp + (tempJson[i].headerText ? `<div></div><b>${tempJson[i].headerText}</b>` : '<div></div>');
      }
    }
    return temp;
  }

  getMethod(methodJson): string {
    const tempJson = [];
    let itemSection = { headerText: null, items: [] };
    methodJson = JSON.parse(methodJson);
    for (const s of methodJson) {
      if (s.is_header === 1 || s.is_header === '1') {
        if (itemSection.items.length > 0) {
          tempJson.push(itemSection);
          itemSection = { headerText: null, items: [] };
        }
        itemSection.headerText = this.replaceExtraChar(s.value);
      } else {
        itemSection.items.push(this.replaceExtraChar(s.value));
      }
    }
    tempJson.push(itemSection);
    let temp = '';
    for (let i = 0; i < tempJson.length; i++) {
      if (i === 0) {
        temp = temp + (tempJson[i].headerText ? `<b>${this.replaceExtraChar(tempJson[i].headerText)}</b>` : '');
        if (tempJson[i].items.length > 0) {
          temp = temp + `<ul>`;
          for (const ti of tempJson[i].items) {
            temp = temp + `<li>${this.replaceExtraChar(ti)}</li>`;
          }
          temp = temp + `</ul>`;
        }
      } else {
        temp = temp + (tempJson[i].headerText ? `<div></div><b>${tempJson[i].headerText}</b>` : '<div></div>');
      }
    }
    return temp;
  }

  replaceExtraChar(tempText: string): string {
    if (tempText) {
      tempText = tempText.replace('<br>', '');
      tempText = tempText.replace('<br/>', '');
      tempText = tempText.replace('</br>', '');
      return tempText;
    } else {
      return '';
    }
  }

  @Get('recipe-pdf')
  async generateRecipePdfs() {
    try {
      const records = await this.recipeRepository.findAll({
        include: [
          {
            model: MstRecipeType,
            required: true,
          },
        ],
      });
      const recipes = records.map((x) => {
        return {
          id: x.recipeId,
          name: x.name,
          howToMake: x.howToMake,
          ingredient: x.ingredient,
          imagePath: x.imagePath,
          serving: x.servingCount,
          recipeType: x.recipeType.recipeType,
        };
      });
      console.log(recipes.length);
      for (const r of recipes) {
        await this.recipeService.generateRecipePdf(r.id, r);
      }
    } catch (e) {
      console.log(e);
    }
  }
}
