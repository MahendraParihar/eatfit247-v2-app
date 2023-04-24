import moment from 'moment';
import { IAdminShortInfo } from './admin-user.interface';
import { IMediaUpload } from './media-upload.interface';
import { IAddress } from './address.interface';
import { IRole } from './role.interface';

export interface IAdminUserList {
  adminId: number;
  firstName: string;
  lastName: string;
  countryCode: string;
  contactNumber: string;
  emailId: string;
  franchiseId?: number;
  adminUserStatusId: number;
  deactivationReason?: string;
  startDate: moment.Moment;
  endDate?: moment.Moment;
  imagePath: IMediaUpload[];
  createdBy: IAdminShortInfo;
  updatedBy: IAdminShortInfo;
  createdAt: string;
  updatedAt: string;
  addressObj?: IAddress;
  roleList: IRole[];
}
