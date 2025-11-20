import { IMediaUpload } from './media-upload.interface';
import { IAdminShortInfo } from './admin-user.interface';
import { IAddress } from './address.interface';

export interface IReferrer {
  id: any;
  name: string;
  companyName?: string;
  websiteLink?: string;
  franchiseId?: number;
  contactNumber?: string;
  emailId?: string;
  alternateContactNumber?: string;
  alternateEmailId?: string;
  panNumber?: string;
  tanNumber?: string;
  gstNumber?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  active?: boolean;
  imagePath?: IMediaUpload[];
  createdBy: IAdminShortInfo;
  updatedBy: IAdminShortInfo;
  createdAt: string;
  updatedAt: string;

  addressObj?: IAddress;
}
