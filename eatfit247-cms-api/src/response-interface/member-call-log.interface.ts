import { IMediaUpload } from './media-upload.interface';
import { IAdminShortInfo } from './admin-user.interface';
import moment from 'moment';

export interface IMemberCallLog {
  id: number;
  callPurposeId: number;
  callLogStatusId: number;
  callTypeId: number;
  callPurpose?: string;
  callLogStatus?: string;
  callType?: string;
  detail?: string;
  conversionHistory?: string;
  date: moment.Moment;
  startTime: string;
  endTime: string;
  active?: boolean;
  imagePath?: IMediaUpload[];
  createdBy: IAdminShortInfo;
  updatedBy: IAdminShortInfo;
  createdAt: string;
  updatedAt: string;
}
