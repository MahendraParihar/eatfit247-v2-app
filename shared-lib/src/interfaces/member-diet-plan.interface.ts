import { ICreateUpdate, IDropdownItem } from "./common.interface";
import { IMediaUpload } from "./media-upload.interface";

export interface IMemberDietPlan extends ICreateUpdate {
  program: string;
  programCategory: string;
  id: number;
  memberId: number;
  startDate?: string | Date;
  endDate?: string | Date;
  noOfCycle: number;
  noOfDaysInCycle: number;
  currentCycleNo?: number;
  currentDayNo?: number;
  dietPlanStatusId: number;
  dietPlanStatus: string;
  cyclePlans: any[];
  deletable: boolean;
  upcomingDay?: number;
  upcomingCycle?: number;
  showActionBtn: boolean;
  showDaily: boolean;
  showWeekly: boolean;
}

export interface ICyclePlan {
  cycleNo: number;
  startDate: string | Date;
  endDate: string | Date;
  type: string;
  dietPlans: any[];
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

export interface IMemberDietDetail {
  id: number;
  dietPlanId: number;
  startDate?: string | Date;
  endDate?: string | Date;
  cycleNo: number;
  dayNo?: number;
  noOfCycle: number;
  noOfDaysInCycle: number;
  dietPlan: IDietPlanDetail[];
  type: string;
  isDeletable: boolean;
}

export interface IDietDetail {
  recipeCategoryId: number;
  recipeCategory: string;
  startTime: string;
  endTime: string;
  diet: string;
  recipeIds: number[];
}

export class IMemberDietPlanDetail {
  startDate: Date;
  endDate: Date;
  cycleNo: number;
  dayNo: number;
  dietPlanId: number;
  dietPlan: IDietPlanDetail[];
}

export class IDietPlanDetail {
  dietDetail: string;
  recipeCategory: string;
  recipeCategoryId: number;
  recipeIds: number[];
}

export class IMemberDietTemplate {
  dietTemplateId: number;
  memberDietPlanId: number;
}
