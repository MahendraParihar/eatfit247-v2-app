import { IMediaUpload } from "./media-upload.interface";
import { IDropdownItem } from "./common.interface";
import { IAddressBasic } from "./address.interface";

export interface IAdminMasterData {
  role: IDropdownItem[];
  franchise: IDropdownItem[];
  adminStatus: IDropdownItem[];
  countryCode: IDropdownItem[];
}

export interface IAdminShortInfo {
  adminId: number;
  firstName: string;
  lastName: string;
  imagePath?: IMediaUpload[];
}

export class IManageAdminUser {
  firstName: string;
  lastName: string;
  franchiseId?: number;
  contactNumber: string;
  countryCode: string;
  emailId?: string;
  startDate: Date;
  endDate?: Date;
  imagePath?: IMediaUpload[];
  adminUserStatusId: number;
  reason?: string;
  roleId: number;
  address?: IAddressBasic;
}

export class IChangePassword {
  password: string;
  newPassword: string;
  repeatPassword: string;
}
