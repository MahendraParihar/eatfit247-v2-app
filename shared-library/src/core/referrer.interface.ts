import { IBaseAdminUser } from "../base.interface";
import { IMediaUpload } from "./media-upload.interface";

export interface IBaseReferrer {
  name: string;
  companyName?: string;
  websiteLink?: string;
  logo?: IMediaUpload[];
  franchiseId: number;
  emailId: string;
  alternateEmailId: string;
  contactNumber: string;
  alternateContactNumber: string;
  postalAddress: string;
  stateId?: number;
  countryId?: number;
  pinCode?: string;
  panNumber?: string;
  tanNumber?: string;
  gstNumber?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface IManageReferrer extends IBaseReferrer {
  referrerId?: number;
  active: boolean;
}

export interface IReferrer extends IBaseReferrer {
  referrerId: number;
  franchise?: string;
  state?: string;
  country?: string;
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

