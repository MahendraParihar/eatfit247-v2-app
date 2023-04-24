import {AdminShortInfoModel} from "./admin-short-info.model";
import {MediaUploadResponseModel} from "./media-upload-response.model";

export class BaseModel {
  id: number;
  active: boolean;
  imagePath?: MediaUploadResponseModel[];
  createdAt: string;
  createdBy: AdminShortInfoModel;
  updatedAt: string;
  updatedBy: AdminShortInfoModel;

  static fromJson(data: any): BaseModel | null {
    if (!data) {
      return null;
    }
    const authUserObj: BaseModel = new BaseModel();
    authUserObj.id = data.id;
    authUserObj.active = data.active;
    authUserObj.imagePath = data.imagePath ? <MediaUploadResponseModel[]>data.imagePath : null;
    authUserObj.createdBy = AdminShortInfoModel.fromJson(data.createdBy);
    authUserObj.updatedBy = AdminShortInfoModel.fromJson(data.updatedBy);
    authUserObj.createdAt = data.createdAt;
    authUserObj.updatedAt = data.updatedAt;
    return authUserObj;
  }
}
