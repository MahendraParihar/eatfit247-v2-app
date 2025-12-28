import { IBaseAdminUser } from "../base.interface";

export interface IBaseMemberCallLog {
  memberId: number;
  date: Date;
  startTime: Date;
  endTime: Date;
  callTypeId: number;
  callPurposeId: number;
  callLogStatusId: number;
  detail: string;
  conversionHistory: string;
  isMailSuccess: boolean;
  nutritionistId?: number;
  meetingLink?: string;
  calendarEventId?: string;
  isSystemGenerated: boolean;
  active: boolean;
}

export interface IManageMemberCallLog extends IBaseMemberCallLog {
  memberCallLogId?: number;
}

export interface IMemberCallLog extends IBaseMemberCallLog {
  memberCallLogId: number;
  callType: string;
  callPurpose: string;
  callLogStatus: string;
  memberName: string;
  memberFirstName: string;
  memberLastName: string;
  memberEmail: string;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
  nutritionist?: IBaseAdminUser;
}
