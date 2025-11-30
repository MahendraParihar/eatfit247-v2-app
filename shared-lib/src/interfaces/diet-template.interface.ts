import { ICreateUpdate } from "./common.interface";
import { IDietDetail } from "./member-diet-plan.interface";

export interface IDietTemplate extends ICreateUpdate {
  id: number;
  name: string;
  noOfCycle: number;
  noOfDaysInCycle: number;
  isWeekly: boolean;
}

export interface IDietDetailTemplate {
  id: number;
  dietPlanId: number;
  cycleNo: number;
  dayNo: number;
  dietDetail: IDietDetail;
}
