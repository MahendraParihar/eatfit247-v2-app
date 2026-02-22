import { IAdminInfo } from '../base.interface';
import { IMediaUpload } from './media-upload.interface';

export interface IBaseMember {
  firstName: string;
  lastName: string;
  profilePicture?: IMediaUpload[];
  countryCode: string;
  contactNumber: string;
  emailId: string;
  franchiseId?: number; // Optional - can be auto-determined based on countryId
  countryId: number;
  referrerId?: number;
  nutritionistId?: number;
  active: boolean;
  deactivationReason?: string;
  hasAnyPlan?: boolean;
}

export interface IManageMember extends IBaseMember {
  memberId?: number;
  password?: string; // For create/update operations
}

export interface IMember extends IBaseMember, IAdminInfo {
  memberId: number;
  referrer?: string; // Referrer name from relationship
  franchise?: string; // Franchise name from relationship
  country?: string; // Country name from relationship
  nutritionist?: string; // Nutritionist name from relationship
  userStatus?: string; // User status from relationship
}

