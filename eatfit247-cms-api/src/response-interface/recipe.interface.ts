import { IMediaUpload } from './media-upload.interface';
import { IAdminShortInfo } from './admin-user.interface';

export interface IRecipe {
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
  createdBy: IAdminShortInfo;
  updatedBy: IAdminShortInfo;
  createdAt: string;
  updatedAt: string;
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
