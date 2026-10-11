import { IAdminInfo } from '../base.interface';
import { IMediaUpload } from './media-upload.interface';

export interface IBaseProgramPlan {
  plan: string;
  details?: string;
  imagePath?: IMediaUpload[];
  sequenceNumber: number;
  noOfCycle: number;
  noOfDaysInCycle: number;
  isOnline: boolean;
  isVisibleOnWeb: boolean;
  /** UAE VAT ER Art 23: automated/app-delivered plan (true) vs human-delivered coaching (false). Stored only. */
  isElectronicService?: boolean;
  programPlanFees: { fees: number; currencyCode: string }[];
}

export interface IManageProgramPlan extends IBaseProgramPlan {
  programPlanId?: number;
  active: boolean;
}

export interface IProgramPlan extends IBaseProgramPlan, IAdminInfo {
  programPlanId: number;
  active: boolean;
}

