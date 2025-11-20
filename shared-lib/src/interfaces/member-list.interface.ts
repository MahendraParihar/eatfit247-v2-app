import { IAdminShortInfo } from './admin-user.interface';
import { IMediaUpload } from './media-upload.interface';

export interface IMemberList {
  memberId: number;
  firstName: string;
  lastName: string;
  countryCode: string;
  contactNumber: string;
  emailId: string;
  franchiseId: number;
  nutritionistId: number;
  countryId: number;
  countryName?: string;
  referrerId?: number;
  userStatusId: number;
  hasAnyPlan: boolean;
  deactivationReason?: string;
  imagePath: IMediaUpload[];
  createdBy: IAdminShortInfo;
  updatedBy: IAdminShortInfo;
  nutritionist?: IAdminShortInfo;
  createdAt: string;
  updatedAt: string;
  memberReferrer?: IMemberReferrer;
  memberFranchise: IMemberFranchise;
  isAssessmentSubmitted: boolean;
}

export interface IMemberReferrer {
  referrerId: number;
  name: string;
  companyName: string;
  imagePath: IMediaUpload[];
  emailId: string;
  contactNumber: string;
}

export interface IMemberFranchise {
  franchiseId: number;
  companyName: string;
  imagePath: IMediaUpload[];
  emailId: string;
  contactNumber: string;
  firstName: string;
  lastName: string;
}

export interface IMemberDetails {
  memberBasicInfo: IMemberList;
}
