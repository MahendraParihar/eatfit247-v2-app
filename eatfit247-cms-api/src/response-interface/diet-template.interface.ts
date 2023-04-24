import { IAdminShortInfo } from './admin-user.interface';
import { IDietDetail } from './diet-detail.interface';

export interface IDietTemplate {
  id: number;
  name: string;
  noOfCycle: number;
  noOfDaysInCycle: number;
  isWeekly: boolean;
  active?: boolean;
  createdBy: IAdminShortInfo;
  updatedBy: IAdminShortInfo;
  createdAt: string;
  updatedAt: string;
}

export interface IDietDetailTemplate {
  id: number;
  dietPlanId: number;
  cycleNo: number;
  dayNo: number;
  dietDetail: IDietDetail;
}
