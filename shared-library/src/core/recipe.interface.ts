import { IAdminInfo, ICommonSEO } from '../base.interface';
import { IMediaUpload } from './media-upload.interface';

// Recipe Category Interfaces
export interface IBaseRecipeCategory {
  recipeCategory: string;
  imagePath?: IMediaUpload[];
  fromTime: string;
  toTime: string;
  sequence: number;
}

export interface IManageRecipeCategory extends IBaseRecipeCategory {
  recipeCategoryId?: number;
  active: boolean;
}

export interface IRecipeCategory extends IBaseRecipeCategory, IAdminInfo {
  recipeCategoryId: number;
  active: boolean;
}

// Recipe Cuisine Interfaces
export interface IBaseRecipeCuisine {
  recipeCuisine: string;
  imagePath?: IMediaUpload[];
}

export interface IManageRecipeCuisine extends IBaseRecipeCuisine {
  recipeCuisineId?: number;
  active: boolean;
}

export interface IRecipeCuisine extends IBaseRecipeCuisine, IAdminInfo {
  recipeCuisineId: number;
  active: boolean;
}

// Recipe Type Interfaces
export interface IBaseRecipeType {
  recipeType: string;
  imagePath?: IMediaUpload[];
}

export interface IManageRecipeType extends IBaseRecipeType {
  recipeTypeId?: number;
  active: boolean;
}

export interface IRecipeType extends IBaseRecipeType, IAdminInfo {
  recipeTypeId: number;
  active: boolean;
}

// Recipe Interfaces
export interface IBaseRecipe {
  name: string;
  recipeTypeId: number;
  details?: string;
  ingredient?: string;
  howToMake?: string;
  benefits?: string;
  imagePath: IMediaUpload[];
  servingCount: number;
  downloadPath?: IMediaUpload[];
  isVisibleToAll: boolean;
}

export interface IManageRecipe extends IBaseRecipe {
  recipeCategoryIds: number[];
  recipeCuisineIds: number[];
  recipeId?: number;
  active: boolean;
}

export interface IRecipe extends IBaseRecipe, IAdminInfo {
  recipeId: number;
  recipeType?: string;
  visitedCount: number;
  shareCount: number;
  active: boolean;
  recipeCategoryMappings: {
    recipeCategoryId: number;
    recipeCategory: string;
    recipeId: number;
  }[];
  recipeCuisineMappings: { recipeCuisineId: number; recipeCuisine: string; recipeId: number }[];
}

// Recipe Category Mapping Interfaces
export interface IBaseRecipeCategoryMapping {
  recipeId: number;
  recipeCategoryId: number;
}

export interface IManageRecipeCategoryMapping extends IBaseRecipeCategoryMapping {
  recipeCategoryMappingId?: number;
  active: boolean;
}

export interface IRecipeCategoryMapping extends IBaseRecipeCategoryMapping {
  recipeCategoryMappingId: number;
  active: boolean;
  createdBy: number;
  modifiedBy: number;
  createdAt: Date;
  updatedAt: Date;
}

// Recipe Cuisine Mapping Interfaces
export interface IBaseRecipeCuisineMapping {
  recipeId: number;
  recipeCuisineId: number;
}

export interface IManageRecipeCuisineMapping extends IBaseRecipeCuisineMapping {
  recipeCuisineMappingId?: number;
  active: boolean;
}

export interface IRecipeCuisineMapping extends IBaseRecipeCuisineMapping {
  recipeCuisineMappingId: number;
  active: boolean;
  createdBy: number;
  modifiedBy: number;
  createdAt: Date;
  updatedAt: Date;
}

// Recipe Nutritive Interfaces
export interface IBaseRecipeNutritive {
  recipeId: number;
  nutritiveId: number;
  value: number;
}

export interface IManageRecipeNutritive extends IBaseRecipeNutritive {
  recipeNutritiveId?: number;
  active: boolean;
}

export interface IRecipeNutritive extends IBaseRecipeNutritive {
  recipeNutritiveId: number;
  active: boolean;
  createdBy: number;
  modifiedBy: number;
  createdAt: Date;
  updatedAt: Date;
}

