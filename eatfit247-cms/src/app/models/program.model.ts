import {BaseModel} from "./base.model";
import {MediaUploadResponseModel} from "./media-upload-response.model";
import {AdminShortInfoModel} from "./admin-short-info.model";

export class ProgramModel extends BaseModel {
  title?: string;
  programCategoryId: number;
  programCategory?: string;
  details?: string;
  idealFor?: string;
  punchLine?: string;
  videoUrl?: string;
  sequenceNumber: number;
  isSpecialProgram: boolean;
  tags: string[];
  url: string;

  static override fromJson(data: any): ProgramModel | null {
    if (!data) {
      return null;
    }
    const authUserObj: ProgramModel = new ProgramModel();
    authUserObj.id = data.id;
    authUserObj.title = data.title;
    authUserObj.programCategoryId = data.programCategoryId;
    authUserObj.programCategory = data.programCategory;
    authUserObj.details = data.details;
    authUserObj.idealFor = data.idealFor;
    authUserObj.punchLine = data.punchLine;
    authUserObj.sequenceNumber = data.sequenceNumber;
    authUserObj.isSpecialProgram = data.isSpecialProgram;
    authUserObj.videoUrl = data.videoUrl;
    authUserObj.tags = data.tags;
    authUserObj.url = data.url;
    authUserObj.active = data.active;
    authUserObj.imagePath = data.imagePath ? <MediaUploadResponseModel[]>data.imagePath : null;
    authUserObj.createdBy = AdminShortInfoModel.fromJson(data.createdBy);
    authUserObj.updatedBy = AdminShortInfoModel.fromJson(data.updatedBy);
    authUserObj.createdAt = data.createdAt;
    authUserObj.updatedAt = data.updatedAt;
    return authUserObj;
  }
}
