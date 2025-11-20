import { IMediaUpload } from './media-upload.interface';
import { ICreateUpdate } from './lov.interface';

export interface IProgramPlan extends ICreateUpdate {
  id: any;
  title: string;
  inrAmount: number;
  noOfCycle: number;
  noOfDaysInCycle: number;
  isOnline: boolean;
  programPlanTypeId: number;
  programPlanType?: string;
  isVisibleOnWeb: boolean;
  details: string;
  url: string;
  sequenceNumber: number;
  tags: string[];
  active: boolean;
  imagePath: IMediaUpload[];
}

export interface IPlanFees {
  id: any;
  title: string;
  inrAmount: number;
  noOfCycle: number;
  noOfDaysInCycle: number;
  isOnline: boolean;
}
