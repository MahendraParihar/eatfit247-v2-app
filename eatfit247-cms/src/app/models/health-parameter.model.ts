import {AdminShortInfoModel} from "./admin-short-info.model";
import {MediaUploadResponseModel} from "./media-upload-response.model";
import {LovModel} from "./lov.model";

export class HealthParameterModel extends LovModel {
  isLength: boolean;

  static override fromJson(data: any): HealthParameterModel | null {
    if (!data) {
      return null;
    }
    const authUserObj: HealthParameterModel = new HealthParameterModel();
    authUserObj.id = data.id;
    authUserObj.name = data.name;
    authUserObj.isLength = data.isLength;
    authUserObj.active = data.active;
    authUserObj.imagePath = data.imagePath ? <MediaUploadResponseModel[]>data.imagePath : null;
    authUserObj.createdBy = AdminShortInfoModel.fromJson(data.createdBy);
    authUserObj.updatedBy = AdminShortInfoModel.fromJson(data.updatedBy);
    authUserObj.createdAt = data.createdAt;
    authUserObj.updatedAt = data.updatedAt;
    return authUserObj;
  }
}
