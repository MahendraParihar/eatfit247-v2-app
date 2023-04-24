import {MediaUploadResponseModel} from "./media-upload-response.model";
import {AdminShortInfoModel} from "./admin-short-info.model";
import {BaseModel} from "./base.model";
import {AddressModel} from "./address.model";

export class AdminRole {
  id: number;
  role: string;
  roleId: number;
  adminId?: number;

  static fromJson(data: any): AdminRole | null {
    if (!data) {
      return null;
    }
    const authUserObj: AdminRole = new AdminRole();
    authUserObj.id = data.id;
    authUserObj.role = data.role;
    authUserObj.roleId = data.roleId;
    authUserObj.adminId = data.adminId;
    return authUserObj;
  }
}

export class AdminUserModel extends BaseModel {
  firstName: string;
  lastName: string;
  password?: string;
  countryCode: string;
  contactNumber: string;
  emailId: string;
  adminUserStatusId: number;
  deactivationReason?: string;
  startDate: string;
  endDate?: string;
  franchiseId?: number;
  addressObj: AddressModel = null;
  roleList: AdminRole[];

  static override fromJson(data: any): AdminUserModel | null {
    if (!data) {
      return null;
    }
    const authUserObj: AdminUserModel = new AdminUserModel();
    authUserObj.id = data.adminId;
    authUserObj.firstName = data.firstName;
    authUserObj.lastName = data.lastName;
    authUserObj.imagePath = data.imagePath ? <MediaUploadResponseModel[]>data.imagePath : null;
    authUserObj.countryCode = data.countryCode;
    authUserObj.contactNumber = data.contactNumber;
    authUserObj.emailId = data.emailId;
    authUserObj.adminUserStatusId = data.adminUserStatusId;
    authUserObj.startDate = data.startDate ? data.startDate : null;
    authUserObj.endDate = data.endDate ? data.endDate : null;
    authUserObj.deactivationReason = data.deactivationReason;
    authUserObj.franchiseId = data.franchiseId;
    authUserObj.createdBy = AdminShortInfoModel.fromJson(data['createdBy']);
    authUserObj.updatedBy = AdminShortInfoModel.fromJson(data['updatedBy']);
    authUserObj.createdAt = data.createdAt;
    authUserObj.updatedAt = data.updatedAt;
    if (data.addressObj) {
      authUserObj.addressObj = AddressModel.fromJson(data.addressObj);
    }
    if (data.roleList) {
      authUserObj.roleList = [];
      for (const s of data.roleList) {
        authUserObj.roleList.push(AdminRole.fromJson(s));
      }
    }
    return authUserObj;
  }
}
