import { InjectModel } from '@nestjs/sequelize';
import { MstRecipe } from '../../core/database/models/mst-recipe.model';
import { MstRecipeCategoryMapping } from '../../core/database/models/mst-recipe-category-mapping.model';
import { MstRecipeCuisineMapping } from '../../core/database/models/mst-recipe-cuisine-mapping.model';
import { MstRecipeNutritive } from '../../core/database/models/mst-recipe-nutritive.model';
import { Controller, Get } from '@nestjs/common';
import * as csv from 'csvtojson';
import { CommonFunctionsUtil } from '../../util/common-functions-util';

@Controller('migration')
export class RecipeMigrationController {
  constructor(
    @InjectModel(MstRecipe) private readonly recipeRepository: typeof MstRecipe,
    @InjectModel(MstRecipeCategoryMapping) private readonly recipeCategoryRepository: typeof MstRecipeCategoryMapping,
    @InjectModel(MstRecipeCuisineMapping) private readonly recipeCuisineRepository: typeof MstRecipeCuisineMapping,
    @InjectModel(MstRecipeNutritive) private readonly recipeNutritiveRepository: typeof MstRecipeNutritive,
  ) {}

  @Get('recipe')
  async init() {
    const recipeList = [];
    const recipeCategoryList = [];
    const recipeCuisineList = [];
    const recipeNutritiveList = [];
    let data = await csv({ delimiter: '|' }).fromFile('/home/mahendra/Downloads/mst_recipe.csv');
    for (const s of data) {
      const imagePath = s.image_path ? s.image_path.split('/')[1] : null;
      recipeList.push({
        recipeId: Number(s.id),
        name: s.name,
        recipeTypeId: Number(s.is_veg) === 1 ? 1 : 2,
        details: s.details,
        benefits: s.benefits,
        imagePath: [
          {
            size: 227093,
            webUrl: 'media-files/recipe/' + imagePath,
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
    const rr = await this.recipeRepository.bulkCreate(recipeList);
    const rCC = await this.recipeCategoryRepository.bulkCreate(recipeCategoryList);
    const rrCR = await this.recipeCuisineRepository.bulkCreate(recipeCuisineList);
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
}
