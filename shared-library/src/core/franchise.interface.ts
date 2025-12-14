import { IBaseAdminUser } from '../base.interface';
import { IMediaUpload } from './media-upload.interface';

export interface IBaseFranchise {
  companyName: string;
  logo?: IMediaUpload[];
  firstName: string;
  lastName: string;
  emailId: string;
  alternateEmailId: string;
  contactNumber: string;
  alternateContactNumber: string;
  panNumber: string;
  tanNumber: string;
  gstNumber: string;
  startDate: Date;
  endDate?: Date;
  isPrimary: boolean;
}

export interface IManageFranchise extends IBaseFranchise {
  franchiseId?: number;
  active: boolean;
}

export interface IFranchise extends IBaseFranchise {
  franchiseId: number;
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

