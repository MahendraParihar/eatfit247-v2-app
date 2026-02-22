import { IAdminInfo } from '../base.interface';
import { IMediaUpload } from './media-upload.interface';

export interface IBaseCallLogStatus {
  callLogStatus: string;
}

export interface IManageCallLogStatus extends IBaseCallLogStatus {
  callLogStatusId?: number;
  active: boolean;
}

export interface ICallLogStatus extends IBaseCallLogStatus, IAdminInfo {
  callLogStatusId: number;
  active: boolean;
}

export interface IBaseCallPurpose {
  callPurpose: string;
  imagePath?: IMediaUpload[];
}

export interface IManageCallPurpose extends IBaseCallPurpose {
  callPurposeId?: number;
  active: boolean;
}

export interface ICallPurpose extends IBaseCallPurpose, IAdminInfo {
  callPurposeId: number;
  active: boolean;
}

export interface IBaseCallType {
  callType: string;
  imagePath?: IMediaUpload[];
}

export interface IManageCallType extends IBaseCallType {
  callTypeId?: number;
  active: boolean;
}

export interface ICallType extends IBaseCallType, IAdminInfo {
  callTypeId: number;
  active: boolean;
}