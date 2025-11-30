import { IBaseAdminUser } from '../base.interface';
import { IMediaUpload } from './media-upload.interface';

export interface IBaseMember {
  firstName: string;
  lastName: string;
  profilePicture?: IMediaUpload[];
  countryCode: string;
  contactNumber: string;
  emailId: string;
  franchiseId: number;
  countryId: number;
  referrerId?: number;
  nutritionistId?: number;
  userStatusId: number;
  deactivationReason?: string;
  hasAnyPlan?: boolean;
}

export interface IManageMember extends IBaseMember {
  memberId?: number;
  uploadFiles?: IMediaUpload[];
  password?: string; // For create/update operations
}

export interface IMember extends IBaseMember {
  memberId: number;
  id?: number; // For compatibility with old interface
  referrer?: string; // Referrer name from relationship
  franchise?: string; // Franchise name from relationship
  country?: string; // Country name from relationship
  nutritionist?: string; // Nutritionist name from relationship
  userStatus?: string; // User status from relationship
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

