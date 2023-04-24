import {AdminShortInfoModel} from "./admin-short-info.model";
import {MediaUploadResponseModel} from "./media-upload-response.model";
import {LovModel} from "./lov.model";
import {AddressModel} from "./address.model";

export class ReferrerModel extends LovModel {
  companyName: string;
  websiteLink?: string;
  franchiseId: number;
  contactNumber: string;
  emailId: string;
  alternateContactNumber?: string;
  alternateEmailId?: string;
  panNumber?: string;
  tanNumber?: string;
  gstNumber?: string;
  startDate: string;
  endDate?: string;
  addressObj: AddressModel = null;

  static override fromJson(data: any): ReferrerModel | null {
    if (!data) {
      return null;
    }
    const authUserObj: ReferrerModel = new ReferrerModel();
    authUserObj.id = data.id;
    authUserObj.name = data.name;
    authUserObj.companyName = data.companyName;
    authUserObj.websiteLink = data.websiteLink;
    authUserObj.franchiseId = data.franchiseId;
    authUserObj.contactNumber = data.contactNumber;
    authUserObj.emailId = data.emailId;
    authUserObj.alternateContactNumber = data.alternateContactNumber;
    authUserObj.alternateEmailId = data.alternateEmailId;
    authUserObj.panNumber = data.panNumber;
    authUserObj.tanNumber = data.tanNumber;
    authUserObj.gstNumber = data.gstNumber;
    authUserObj.startDate = data.startDate;
    authUserObj.endDate = data.endDate;
    authUserObj.name = data.name;
    authUserObj.active = data.active;
    authUserObj.imagePath = data.imagePath ? <MediaUploadResponseModel[]>data.imagePath : null;
    authUserObj.createdBy = AdminShortInfoModel.fromJson(data.createdBy);
    authUserObj.updatedBy = AdminShortInfoModel.fromJson(data.updatedBy);
    authUserObj.createdAt = data.createdAt;
    authUserObj.updatedAt = data.updatedAt;
    if (data.addressObj) {
      authUserObj.addressObj = AddressModel.fromJson(data.addressObj);
    }
    return authUserObj;
  }
}
