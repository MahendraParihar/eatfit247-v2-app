import {MediaUploadResponseModel} from "./media-upload-response.model";

export class AdminShortInfoModel {
  adminId: number;
  firstName: string;
  lastName: string;
  imagePath?: MediaUploadResponseModel[];
  cityVillageId: number;
  cityVillage: string;

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  static fromJson(data: any): AdminShortInfoModel | null {
    if (!data) {
      return null;
    }
    const obj: AdminShortInfoModel = new AdminShortInfoModel();
    obj.adminId = data.adminId;
    obj.firstName = data.firstName;
    obj.lastName = data.lastName;
    obj.imagePath = data.imagePath ? (Array.isArray(data.imagePath) ? data.imagePath : [data.imagePath]) : [];
    obj.cityVillageId = data.cityVillageId;
    obj.cityVillage = data.cityVillage;
    return obj;
  }
}
