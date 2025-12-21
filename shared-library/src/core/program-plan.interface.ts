import { IBaseAdminUser, ICommonSEO } from "../base.interface";
import { IMediaUpload } from "./media-upload.interface";

export interface IBaseProgramPlan {
  plan: string;
  details?: string;
  imagePath?: IMediaUpload[];
  sequenceNumber: number;
  noOfCycle: number;
  noOfDaysInCycle: number;
  programPlanTypeId: number;
  isOnline: boolean;
  isVisibleOnWeb: boolean;
  programPlanFees: { fees: number; currencyCode: string }[];
}

export interface IManageProgramPlan extends IBaseProgramPlan {
  programPlanId?: number;
  active: boolean;
}

export interface IProgramPlan extends IBaseProgramPlan {
  programPlanId: number;
  programPlanType?: string;
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

