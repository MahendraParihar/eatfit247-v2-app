import { IMediaUpload } from './media-upload.interface';
import { IAdminShortInfo } from './admin-user.interface';
import moment from 'moment';
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
  startDate?: moment.Moment;
  endDate?: moment.Moment;
  active?: boolean;
  imagePath?: IMediaUpload[];
  createdBy: IAdminShortInfo;
  updatedBy: IAdminShortInfo;
  createdAt: string;
  updatedAt: string;

  addressObj?: IAddress;
}
