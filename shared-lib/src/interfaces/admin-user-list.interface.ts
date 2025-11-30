import { IMediaUpload } from './media-upload.interface';
import { IAddress } from './address.interface';
import { IRole } from './role.interface';
import { ICreateUpdate } from './common.interface';

export interface IAdminUserList extends ICreateUpdate {
  adminId: number;
  firstName: string;
  lastName: string;
  countryCode: string;
  contactNumber: string;
  emailId: string;
  franchiseId?: number;
  adminUserStatusId: number;
  reason?: string;
  startDate: string | Date;
  endDate?: string | Date;
  imagePath: IMediaUpload[];
  addressObj?: IAddress;
  roleList: IRole[];
}
