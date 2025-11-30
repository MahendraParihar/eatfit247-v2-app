import { IBaseAdminUser } from '../base.interface';
import { IMediaUpload } from './media-upload.interface';

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
  uploadFiles?: IMediaUpload[];
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
  uploadFiles?: IMediaUpload[];
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

