import { IMediaUpload } from "./media-upload.interface";
import { ICreateUpdate } from "./common.interface";

export class IManageRecipe {
  title: string;
  details: string;
  preparationMethod: string;
  benefits: string;
  ingredients: string;
  recipeCategoryIds: number[];
  recipeCuisineIds: number[];
  recipeTypeId: number;
  servingCount: number;
  isVisibleToAll: boolean;
  tags: string[];
  uploadFiles?: IMediaUpload[];
  active: boolean;
}

export interface IRecipe extends ICreateUpdate {
  id: any;
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
  recipeCategoryList: IRecipeCategoryMapped[];
  recipeCuisineList: IRecipeCuisineMapped[];
  tags: string[];
  url: string;
  active: boolean;
  downloadPath?: string;
  imagePath: IMediaUpload[];
}

export interface IRecipeCategoryMapped {
  recipeId: number;
  recipeCategoryId: number;
  recipeCategory: string;
}

export interface IRecipeCuisineMapped {
  recipeId: number;
  recipeCuisineId: number;
  recipeCuisine: string;
}
