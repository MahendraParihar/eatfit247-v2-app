import { IBaseAdminUser } from "../base.interface";
import { IMediaUpload } from "./media-upload.interface";

export interface IBaseCallLogStatus {
  callLogStatus: string;
}

export interface IManageCallLogStatus extends IBaseCallLogStatus {
  callLogStatusId?: number;
  active: boolean;
}

export interface ICallLogStatus extends IBaseCallLogStatus {
  callLogStatusId: number;
  id?: number; // For compatibility with old interface
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

export interface IBaseCallPurpose {
  callPurpose: string;
  imagePath?: IMediaUpload[];
}

export interface IManageCallPurpose extends IBaseCallPurpose {
  callPurposeId?: number;
  active: boolean;
}

export interface ICallPurpose extends IBaseCallPurpose {
  callPurposeId: number;
  id?: number; // For compatibility with old interface
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

export interface IBaseCallType {
  callType: string;
  imagePath?: IMediaUpload[];
}

export interface IManageCallType extends IBaseCallType {
  callTypeId?: number;
  active: boolean;
}

export interface ICallType extends IBaseCallType {
  callTypeId: number;
  id?: number; // For compatibility with old interface
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

// Call Log Transaction Interface
export interface IBaseCallLog {
  callDate: Date;
  nextFollowUpDate?: Date;
  remarks?: string;
  callPurposeId: number;
  callTypeId: number;
  callLogStatusId: number;
  memberId: number;
}

export interface IManageCallLog extends IBaseCallLog {
  callLogId?: number;
}

export interface ICallLog extends IBaseCallLog {
  callLogId: number;
  callPurpose?: ICallPurpose;
  callType?: ICallType;
  callLogStatus?: ICallLogStatus;
  member?: {
    memberId: number;
    firstName?: string;
    lastName?: string;
  };
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}
