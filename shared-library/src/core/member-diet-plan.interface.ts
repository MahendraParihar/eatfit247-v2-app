import { IBaseAdminUser } from "../base.interface";
import { IDietPlanDetail } from "./diet-template.interface";

export interface IBasicMemberDietPlan {
  memberId: number;
  memberPaymentId: number;
  noOfCycle: number;
  daysInCycle: number;
  currentCycleNo?: number;
  currentDayNo?: number;
  startDate: Date;
  endDate?: Date;
  isCompleted: boolean;
}

export interface IManageMemberDietPlan extends IBasicMemberDietPlan {
  memberDietPlanId?: number;
}

export interface IMemberDietPlan extends IBasicMemberDietPlan {
  program: string;
  programCategory: string;
  dietPlanStatusId: number;
  dietPlanStatus: string;
  cyclePlans: any[];
  deletable: boolean;
  upcomingDay?: number;
  upcomingCycle?: number;
  showActionBtn: boolean;
  showDaily: boolean;
  showWeekly: boolean;
  memberDietPlanId: number;
  memberName: string;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

export interface ICyclePlan {
  cycleNo: number;
  startDate: string | Date;
  endDate: string | Date;
  type: string;
  dietPlans: any[];
}

export interface IMemberDietDetail {
  memberDietDetailId: number;
  memberDietPlanId: number;
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

export interface IMemberDietPlanDetail {
  startDate: Date;
  endDate: Date;
  cycleNo: number;
  dayNo: number;
  dietPlanId: number;
  dietPlan: IDietPlanDetail[];
}

export interface IMemberDietTemplate {
  dietTemplateId: number;
  memberDietPlanId: number;
}
