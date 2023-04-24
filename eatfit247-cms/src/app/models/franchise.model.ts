import {AdminShortInfoModel} from "./admin-short-info.model";
import {MediaUploadResponseModel} from "./media-upload-response.model";
import {BaseModel} from "./base.model";
import {AddressModel} from "./address.model";

export class FranchiseModel extends BaseModel {
  firstName: string;
  lastName: string;
  companyName: string;
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

  static override fromJson(data: any): FranchiseModel | null {
    if (!data) {
      return null;
    }
    const authUserObj: FranchiseModel = new FranchiseModel();
    authUserObj.id = data.id;
    authUserObj.firstName = data.firstName;
    authUserObj.lastName = data.lastName;
    authUserObj.companyName = data.companyName;
    authUserObj.contactNumber = data.contactNumber;
    authUserObj.emailId = data.emailId;
    authUserObj.alternateContactNumber = data.alternateContactNumber;
    authUserObj.alternateEmailId = data.alternateEmailId;
    authUserObj.panNumber = data.panNumber;
    authUserObj.tanNumber = data.tanNumber;
    authUserObj.gstNumber = data.gstNumber;
    authUserObj.startDate = data.startDate;
    authUserObj.endDate = data.endDate;
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
