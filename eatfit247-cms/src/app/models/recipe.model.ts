import {AdminShortInfoModel} from "./admin-short-info.model";
import {MediaUploadResponseModel} from "./media-upload-response.model";
import {BaseModel} from "./base.model";

export class RecipeModel extends BaseModel {
  title: string;
  recipeTypeId: number;
  recipeType?: string;
  details?: string;
  preparationMethod: string;
  ingredients: string;
  servingCount: number;
  benefits: string;
  visitedCount: number;
  shareCount: number;
  isVisibleToAll: boolean;
  recipeCategoryList: RecipeCategoryMapped[];
  recipeCuisineList: RecipeCuisineMapped[];
  tags: string[];
  url: string;
  downloadPath?: string;

  static override fromJson(data: any): RecipeModel | null {
    if (!data) {
      return null;
    }
    const authUserObj: RecipeModel = new RecipeModel();
    authUserObj.id = data.id;
    authUserObj.title = data.title;
    authUserObj.details = data.details;
    authUserObj.recipeTypeId = data.recipeTypeId;
    authUserObj.recipeType = data.recipeType;
    authUserObj.preparationMethod = data.preparationMethod;
    authUserObj.ingredients = data.ingredients;
    authUserObj.servingCount = data.servingCount;
    authUserObj.benefits = data.benefits;
    authUserObj.isVisibleToAll = data.isVisibleToAll;
    authUserObj.visitedCount = data.visitedCount;
    authUserObj.shareCount = data.shareCount;
    authUserObj.tags = data.tags;
    authUserObj.url = data.url;
    authUserObj.active = data.active;
    authUserObj.imagePath = data.imagePath ? <MediaUploadResponseModel[]>data.imagePath : null;
    authUserObj.createdBy = AdminShortInfoModel.fromJson(data.createdBy);
    authUserObj.updatedBy = AdminShortInfoModel.fromJson(data.updatedBy);
    authUserObj.createdAt = data.createdAt;
    authUserObj.updatedAt = data.updatedAt;
    authUserObj.downloadPath = data.downloadPath;
    authUserObj.recipeCategoryList = [];
    if (data.recipeCategoryList && data.recipeCategoryList.length > 0) {
      for (const s of data.recipeCategoryList) {
        authUserObj.recipeCategoryList.push(RecipeCategoryMapped.fromJson(s));
      }
    }
    authUserObj.recipeCuisineList = [];
    if (data.recipeCuisineList && data.recipeCuisineList.length > 0) {
      for (const s of data.recipeCuisineList) {
        authUserObj.recipeCuisineList.push(RecipeCuisineMapped.fromJson(s));
      }
    }
    return authUserObj;
  }
}

export class RecipeCategoryMapped {
  recipeId: number;
  recipeCategoryId: number;
  recipeCategory: string;

  static fromJson(data: any): RecipeCategoryMapped | null {
    if (!data) {
      return null;
    }
    const authUserObj: RecipeCategoryMapped = new RecipeCategoryMapped();
    authUserObj.recipeId = data.recipeId;
    authUserObj.recipeCategoryId = data.recipeCategoryId;
    authUserObj.recipeCategory = data.recipeCategory;
    return authUserObj;
  }
}

export class RecipeCuisineMapped {
  recipeId: number;
  recipeCuisineId: number;
  recipeCuisine: string;

  static fromJson(data: any): RecipeCuisineMapped | null {
    if (!data) {
      return null;
    }
    const authUserObj: RecipeCuisineMapped = new RecipeCuisineMapped();
    authUserObj.recipeId = data.recipeId;
    authUserObj.recipeCuisineId = data.recipeCuisineId;
    authUserObj.recipeCuisine = data.recipeCuisine;
    return authUserObj;
  }
}
