import { IMediaUpload } from './media-upload.interface';
import { IAddress } from './address.interface';
import { ICreateUpdate } from './common.interface';

export interface IReferrer extends ICreateUpdate {
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
  imagePath?: IMediaUpload[];

  addressObj?: IAddress;
}
