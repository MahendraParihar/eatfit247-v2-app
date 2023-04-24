import {AdminShortInfoModel} from "./admin-short-info.model";
import {MediaUploadResponseModel} from "./media-upload-response.model";

export class BlogAuthorModel {
  id?: number;
  firstName: string;
  lastName: string;
  countryCode?: string;
  contactNumber?: string;
  emailId: string;
  linkedUrl?: string;
  active?: boolean;
  imagePath?: MediaUploadResponseModel[];
  createdAt?: string;
  createdBy: AdminShortInfoModel;
  updatedAt?: string;
  updatedBy?: AdminShortInfoModel;

  static fromJson(data: any): BlogAuthorModel | null {
    if (!data) {
      return null;
    }
    const authUserObj: BlogAuthorModel = new BlogAuthorModel();
    authUserObj.id = data.id;
    authUserObj.firstName = data.firstName;
    authUserObj.lastName = data.lastName;
    authUserObj.countryCode = data.countryCode;
    authUserObj.contactNumber = data.contactNumber;
    authUserObj.emailId = data.emailId;
    authUserObj.linkedUrl = data.linkedUrl;
    authUserObj.active = data.active;
    authUserObj.imagePath = data.imagePath ? <MediaUploadResponseModel[]>data.imagePath : null;
    authUserObj.createdBy = AdminShortInfoModel.fromJson(data.createdBy);
    authUserObj.updatedBy = AdminShortInfoModel.fromJson(data.updatedBy);
    authUserObj.createdAt = data.createdAt;
    authUserObj.updatedAt = data.updatedAt;
    return authUserObj;
  }
}
