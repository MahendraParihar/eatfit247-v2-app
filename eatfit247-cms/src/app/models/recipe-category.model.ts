import {AdminShortInfoModel} from "./admin-short-info.model";
import {MediaUploadResponseModel} from "./media-upload-response.model";
import {LovModel} from "./lov.model";

export class RecipeCategoryModel extends LovModel {
  fromTime: string;
  toTime: string;
  sequence: number;

  static override fromJson(data: any): RecipeCategoryModel | null {
    if (!data) {
      return null;
    }
    const authUserObj: RecipeCategoryModel = new RecipeCategoryModel();
    authUserObj.id = data.id;
    authUserObj.name = data.name;
    authUserObj.fromTime = data.fromTime;
    authUserObj.toTime = data.toTime;
    authUserObj.sequence = data.sequence;
    authUserObj.active = data.active;
    authUserObj.imagePath = data.imagePath ? <MediaUploadResponseModel[]>data.imagePath : null;
    authUserObj.createdBy = AdminShortInfoModel.fromJson(data.createdBy);
    authUserObj.updatedBy = AdminShortInfoModel.fromJson(data.updatedBy);
    authUserObj.createdAt = data.createdAt;
    authUserObj.updatedAt = data.updatedAt;
    return authUserObj;
  }
}
