import { IBaseAdminUser } from '../base.interface';
import { IMediaUpload } from './media-upload.interface';

export interface IBaseProgramPlan {
  plan: string;
  url: string;
  details?: string;
  imagePath?: IMediaUpload[];
  tags?: string; // Stored as string in DB, can be comma-separated
  sequenceNumber: number;
  inrAmount: number;
  noOfCycle: number;
  noOfDaysInCycle: number;
  programPlanTypeId: number;
  isOnline: boolean;
  isVisibleOnWeb: boolean;
}

export interface IManageProgramPlan {
  plan: string;
  url?: string; // Optional because it can be auto-generated
  details?: string;
  tags?: string;
  sequenceNumber: number;
  inrAmount: number;
  noOfCycle: number;
  noOfDaysInCycle: number;
  programPlanTypeId: number;
  isOnline: boolean;
  isVisibleOnWeb: boolean;
  programPlanId?: number;
  uploadFiles?: IMediaUpload[];
  active: boolean;
}

export interface IProgramPlan extends IBaseProgramPlan {
  programPlanId: number;
  id?: number; // For compatibility with old interface
  programPlanType?: string;
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

