import {AdminShortInfoModel} from "./admin-short-info.model";
import {MediaUploadResponseModel} from "./media-upload-response.model";
import {BaseModel} from "./base.model";

export class PressMediaModel extends BaseModel {
  title?: string;
  type: 'youtube' | 'press';
  link: string;

  static override fromJson(data: any): PressMediaModel | null {
    if (!data) {
      return null;
    }
    const pressMediaObj: PressMediaModel = new PressMediaModel();
    pressMediaObj.id = data.id;
    pressMediaObj.title = data.title;
    pressMediaObj.type = data.type;
    pressMediaObj.link = data.link;
    pressMediaObj.active = data.active;
    pressMediaObj.imagePath = data.imagePath ? <MediaUploadResponseModel[]>data.imagePath : null;
    pressMediaObj.createdBy = AdminShortInfoModel.fromJson(data.createdBy);
    pressMediaObj.updatedBy = AdminShortInfoModel.fromJson(data.updatedBy);
    pressMediaObj.createdAt = data.createdAt;
    pressMediaObj.updatedAt = data.updatedAt;
    return pressMediaObj;
  }
}

