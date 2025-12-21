import { IBaseAdminUser, ICommonSEO } from "../base.interface";
import { IMediaUpload } from "./media-upload.interface";

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

export interface IRecipeCategory extends IBaseRecipeCategory {
  recipeCategoryId: number;
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
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

export interface IRecipeCuisine extends IBaseRecipeCuisine {
  recipeCuisineId: number;
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
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

export interface IRecipeType extends IBaseRecipeType {
  recipeTypeId: number;
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

// Recipe Interfaces
export interface IBaseRecipe extends ICommonSEO {
  name: string;
  recipeTypeId: number;
  details?: string;
  preparationMethod?: string;
  ingredient?: string;
  howToMake?: string;
  benefits?: string;
  imagePath: IMediaUpload[];
  servingCount: number;
  downloadPath?: IMediaUpload[];
  isVisibleToAll: boolean;
  seo: ICommonSEO;
}

export interface IManageRecipe extends IBaseRecipe {
  recipeId?: number;
  active: boolean;
}

export interface IRecipe extends IBaseRecipe {
  recipeId: number;
  recipeType?: string;
  visitedCount: number;
  shareCount: number;
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
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
  updatedBy: number;
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
  updatedBy: number;
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
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
}

