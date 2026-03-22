import { IAdminInfo } from '../base.interface';
import { IMediaUpload } from './media-upload.interface';
import { IManageAddress } from './location.interface';
import {AdminActionEnum, AdminSubjectEnum} from "../enum";

export interface IAdminPermission {
  action: AdminActionEnum;
  subject: AdminSubjectEnum;
  /** Optional: conditions scoped to franchiseId or ownData */
  conditions?: Record<string, unknown>;
}

/** JWT payload decoded on both server and frontend */
export interface IAdminJwtPayload {
  sub: number;
  email: string;
  roleKeys: string[];          // ← was: roleKey: string
  franchiseIds: number[];
}

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
  /**
   * When sent on create/update, replaces `txn_admin_franchises` for this admin.
   * `mst_admin_users.franchise_id` is set to the smallest id (stable primary) or null if empty.
   * If omitted on update, existing franchise links and `franchise_id` are left unchanged.
   */
  franchiseIds?: number[];
}

export interface IAdminUser extends IBaseAdminUserFull, IAdminInfo {
  adminId: number;
  address?: IManageAddress; // Address details
  roleKeys: string[];
  franchiseIds: number[];
  permissions: IAdminPermission[];
}

export interface IBaseAdminRolePermission {
  roleId: number;
  adminId: number;
}

export interface IManageAdminRolePermission extends IBaseAdminRolePermission {
  adminRolePermissionId?: number;
  active: boolean;
}

export interface IAdminRolePermission extends IBaseAdminRolePermission, IAdminInfo {
  adminRolePermissionId: number;
  id?: number; // For compatibility
  role?: string; // Role name from relationship
  active: boolean;
}

