import { ICreateUpdate } from './lov.interface';
import moment from 'moment/moment';
import { DropdownListInterface } from './dropdown-list.interface';

export interface IMemberDietPlan extends ICreateUpdate {
  program: string;
  programCategory: string;
  id: number;
  memberId: number;
  startDate?: moment.Moment;
  endDate?: moment.Moment;
  noOfCycle: number;
  noOfDaysInCycle: number;
  currentCycleNo?: number;
  currentDayNo?: number;
  deletable: boolean;
  dietPlanStatusId: number;
  dietPlanStatus: string;
  cyclePlans: any[];
}

export interface ICyclePlan {
  cycleNo: number;
  startDate: moment.Moment;
  endDate: moment.Moment;
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
  startDate?: moment.Moment;
  endDate?: moment.Moment;
  cycleNo: number;
  dayNo?: number;
  noOfCycle: number;
  noOfDaysInCycle: number;
  dietPlan: IDietPlanDetail[];
  type: string;
}
