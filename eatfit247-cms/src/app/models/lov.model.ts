import {AdminShortInfoModel} from "./admin-short-info.model";
import {MediaUploadResponseModel} from "./media-upload-response.model";

export class LovModel {
  id?: number;
  name?: string;
  active?: boolean;
  imagePath?: MediaUploadResponseModel[];
  createdAt?: string;
  createdBy: AdminShortInfoModel;
  updatedAt?: string;
  updatedBy?: AdminShortInfoModel;

  static fromJson(data: any): LovModel | null {
    if (!data) {
      return null;
    }
    const authUserObj: LovModel = new LovModel();
    authUserObj.id = data.id;
    authUserObj.name = data.name;
    authUserObj.active = data.active;
    authUserObj.imagePath = data.imagePath ? <MediaUploadResponseModel[]>data.imagePath : null;
    authUserObj.createdBy = AdminShortInfoModel.fromJson(data.createdBy);
    authUserObj.updatedBy = AdminShortInfoModel.fromJson(data.updatedBy);
    authUserObj.createdAt = data.createdAt;
    authUserObj.updatedAt = data.updatedAt;
    return authUserObj;
  }
}
