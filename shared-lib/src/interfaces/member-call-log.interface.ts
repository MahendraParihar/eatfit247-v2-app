import { IMediaUpload } from "./media-upload.interface";
import { ICreateUpdate, IDropdownItem } from "./common.interface";

export interface IMemberCallLog extends ICreateUpdate {
  id: number;
  callPurposeId: number;
  callLogStatusId: number;
  callTypeId: number;
  callPurpose?: string;
  callLogStatus?: string;
  callType?: string;
  detail?: string;
  conversionHistory?: string;
  date: string | Date;
  startTime: string;
  endTime: string;
  imagePath?: IMediaUpload[];
}

export interface IManageMemberCallLog {
  callPurposeId: number;
  memberId: number;
  callStatusId: number;
  callTypeId: number;
  detail?: string;
  conversionHistory?: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  active?: boolean;
}

export interface ICallLogMasterData {
  callType: IDropdownItem[];
  callPurpose: IDropdownItem[];
  callStatus: IDropdownItem[];
}