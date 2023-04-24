import {AdminShortInfoModel} from "./admin-short-info.model";
import {MediaUploadResponseModel} from "./media-upload-response.model";
import {LovModel} from "./lov.model";

export class MemberHealthIssueModel extends LovModel {
  filePath: MediaUploadResponseModel[];
  description: string;
  isSelected: boolean;

  static override fromJson(data: any): MemberHealthIssueModel | null {
    if (!data) {
      return null;
    }
    const authUserObj: MemberHealthIssueModel = new MemberHealthIssueModel();
    authUserObj.id = data.id;
    authUserObj.name = data.name;
    authUserObj.description = data.description;
    authUserObj.isSelected = data.isSelected;
    authUserObj.active = data.active;
    authUserObj.imagePath = data.imagePath ? <MediaUploadResponseModel[]>data.imagePath : null;
    authUserObj.createdBy = AdminShortInfoModel.fromJson(data.createdBy);
    authUserObj.updatedBy = AdminShortInfoModel.fromJson(data.updatedBy);
    authUserObj.createdAt = data.createdAt;
    authUserObj.updatedAt = data.updatedAt;
    return authUserObj;
  }
}
