import { IBaseAdminUser, IAdminInfo } from "../base.interface";
import { IMediaUpload } from "./media-upload.interface";
import { IManageAddress } from "./location.interface";

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
  panNumber?: string;
  tanNumber?: string;
  gstNumber?: string;
  startDate?: Date;
  endDate?: Date;
  address?: IManageAddress;
}

export interface IManageReferrer extends IBaseReferrer {
  referrerId?: number;
  active: boolean;
}

export interface IReferrer extends IBaseReferrer, IAdminInfo {
  referrerId: number;
  franchise?: string;
  active: boolean;
}

export interface IPublicReferrer {
  companyName: string;
  name: string;
  logo?: IMediaUpload[];
}
