import { IBaseAdminUser } from "../base.interface";
import { IMediaUpload } from "./media-upload.interface";
import { IManageAddress } from "./location.interface";

export interface IBaseAdminUserFull {
  firstName: string;
  lastName: string;
  profilePicture?: IMediaUpload[];
  countryCode: string;
  contactNumber: string;
  emailId: string;
  addressId?: number;
  startDate: Date;
  endDate?: Date;
  franchiseId?: number;
  active: boolean;
  deactivationReason?: string;
  verificationCode?: string;
  googleCalendarEmail?: string;
  googleRefreshToken?: string;
  googleTokenScope?: string;
  googleTokenCreatedAt?: Date;
}

export interface IManageAdminUser extends IBaseAdminUserFull {
  adminId?: number;
  password?: string; // For create/update operations
  roleIds?: number[]; // For role permissions
  address?: IManageAddress; // Address details
}

export interface IAdminUser extends IBaseAdminUserFull {
  adminId: number;
  franchise?: string; // Franchise name from relationship
  address?: IManageAddress; // Address details
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

export interface IBaseAdminRolePermission {
  roleId: number;
  adminId: number;
}

export interface IManageAdminRolePermission extends IBaseAdminRolePermission {
  adminRolePermissionId?: number;
  active: boolean;
}

export interface IAdminRolePermission extends IBaseAdminRolePermission {
  adminRolePermissionId: number;
  id?: number; // For compatibility
  role?: string; // Role name from relationship
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

