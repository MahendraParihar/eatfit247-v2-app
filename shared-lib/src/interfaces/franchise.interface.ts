import { IMediaUpload } from "./media-upload.interface";
import { IAddress, IAddressBasic } from "./address.interface";
import { ICreateUpdate } from "./common.interface";

export interface IFranchise extends ICreateUpdate {
  id: any;
  firstName: string;
  lastName: string;
  companyName: string;
  websiteLink?: string;
  contactNumber: string;
  emailId: string;
  alternateContactNumber?: string;
  alternateEmailId?: string;
  panNumber?: string;
  tanNumber?: string;
  gstNumber?: string;
  startDate: string;
  endDate?: string;
  active: boolean;
  imagePath?: IMediaUpload[];
  addressObj: IAddress;
}

export interface IManageFranchise {
  firstName: string;
  lastName: string;
  companyName?: string;
  contactNumber?: string;
  alternateContactNumber?: string;
  emailId?: string;
  alternateEmailId?: string;
  panNumber?: string;
  tanNumber?: string;
  gstNumber?: string;
  startDate: Date;
  endDate?: Date;
  uploadFiles?: IMediaUpload[];
  active: boolean;
  address?: IAddressBasic;
}