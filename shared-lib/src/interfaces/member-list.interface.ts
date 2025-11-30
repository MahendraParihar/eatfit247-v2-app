import { IAdminShortInfo } from "./admin-user.interface";
import { IMediaUpload } from "./media-upload.interface";
import { ICreateUpdate } from "./common.interface";
import { IMemberAssessment } from "./member-assessment.interface";

export interface IMemberList extends ICreateUpdate {
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
  nutritionist?: IAdminShortInfo;
  memberReferrer?: IMemberReferrer;
  memberFranchise: IMemberFranchise;
  isAssessmentSubmitted: boolean;
}

export interface IMemberDetails {
  basicInfo: IMemberList;
  pocketGuideCount: number;
  callScheduleCount: number;
  healthIssueCount: number;
  healthParameterCount: number;
  paymentCount: number;
  healthIssues: string[];
  pocketGuides: string[];
  assessment: IMemberAssessment;
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
