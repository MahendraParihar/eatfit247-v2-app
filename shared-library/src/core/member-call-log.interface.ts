import { IBaseAdminUser, IDropdownItem } from "../base.interface";

export interface ICallLogMasterData {
  callTypes: IDropdownItem[];
  callPurposes: IDropdownItem[];
  callLogStatuses: IDropdownItem[];
  nutritionists: IDropdownItem[];
  durations: IDropdownItem[];
}

export interface IAvailableSlot {
  nutritionistId: number;
  fromDate: string;
  toDate: string;
  duration: number;
}

export interface ICallLogSlot {
  start: Date;
  end: Date;
  id: string;
}

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
