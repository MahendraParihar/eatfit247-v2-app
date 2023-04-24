import { IDietPlanDetail } from './member-diet-plan.interface';

export interface IDietTemplateDetail {
  id: number;
  dietTemplateId: number;
  cycleNo: number;
  dayNo?: number;
  noOfCycle: number;
  noOfDaysInCycle: number;
  dietPlan: IDietPlanDetail[];
  type: string;
  isWeekly: boolean;
}
