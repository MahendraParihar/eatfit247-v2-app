import { IMediaUpload } from './media-upload.interface';
import { IAdminShortInfo } from './admin-user.interface';
import { IAddress } from './address.interface';

export interface IFranchise {
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
  createdBy: IAdminShortInfo;
  updatedBy: IAdminShortInfo;
  createdAt: string;
  updatedAt: string;
  addressObj: IAddress;
}
