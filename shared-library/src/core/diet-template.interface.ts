import { IAdminInfo, IDropdownItem } from '../base.interface';
import { IMediaUpload } from './media-upload.interface';

export interface IBasicDietTemplate {
  dietTemplate: string;
  noOfCycle: number;
  noOfDaysInCycle: number;
  programId?: number;
}

export interface IManageDietTemplate extends IBasicDietTemplate {
  dietTemplateId?: number;
}

export interface IDietTemplate extends IBasicDietTemplate, IAdminInfo {
  dietTemplateId: number;
  showDaily: boolean;
  showWeekly: boolean;
  dietDetails: IDietTemplateDetail[];
  active: boolean;
}

export interface IDietPlanRecipes {
  id: number;
  title: string;
  preparationMethod: string;
  ingredients: string;
  imagePath: IMediaUpload[];
  serving: number;
  recipeType: string;
}

export interface IDietPlanDetail {
  recipeCategoryId: number;
  recipeCategory: string;
  dietDetail: string;
  sequence: number;
  recipeIds: number[];
  recipeList: IDropdownItem[] | IDietPlanRecipes[];
}

export interface IDietTemplateDetail {
  dietTemplateDietDetailId?: number;
  dietTemplateId: number;
  cycleNo: number;
  dayNo?: number;
  dietDetail?: IDietPlanDetail[];
}