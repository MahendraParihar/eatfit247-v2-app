import { AdminShortInfoModel } from "./admin-short-info.model";
import { MediaUploadResponseModel } from "./media-upload-response.model";
import { LovModel } from "./lov.model";
import { ApiUrlEnum } from "../enum/api-url-enum";

export class PocketGuideModel extends LovModel {
  filePath: MediaUploadResponseModel[];
  description: string;

  static override fromJson(data: any): PocketGuideModel | null {
    if (!data) {
      return null;
    }
    const authUserObj: PocketGuideModel = new PocketGuideModel();
    authUserObj.id = data.id;
    authUserObj.name = data.name;
    authUserObj.filePath = data.filePath ? <MediaUploadResponseModel[]>data.filePath : null;
    authUserObj.description = data.description;
    authUserObj.active = data.active;
    authUserObj.imagePath = data.imagePath ? <MediaUploadResponseModel[]>data.imagePath : null;
    authUserObj.createdBy = AdminShortInfoModel.fromJson(data.createdBy);
    authUserObj.updatedBy = AdminShortInfoModel.fromJson(data.updatedBy);
    authUserObj.createdAt = data.createdAt;
    authUserObj.updatedAt = data.updatedAt;
    return authUserObj;
  }
}
