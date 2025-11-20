import { ICreateUpdate } from './lov.interface';
import { DropdownListInterface } from './dropdown-list.interface';

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

export interface IDietPlanDetail {
  recipeCategoryId: number;
  recipeCategory: string;
  dietDetail: string;
  sequence: number;
  recipeIds: number[];
  recipeList: DropdownListInterface[];
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
