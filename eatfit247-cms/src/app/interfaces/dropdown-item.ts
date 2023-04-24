import {MediaUploadResponseModel} from "../models/media-upload-response.model";

export class DropdownItem {
  id: any;
  name: string;
  isSelected: boolean;
  parentId?: number;

  static fromJson(data: any): DropdownItem | null {
    if (!data) {
      return null;
    }
    const authUserObj: DropdownItem = new DropdownItem();
    authUserObj.id = data.id;
    authUserObj.name = data.name;
    authUserObj.isSelected = data.isSelected;
    authUserObj.parentId = data.parentId;
    return authUserObj;
  }
}

export interface MultiTextDropdownItem {
  id: string;
  name: string;
  imagePath: string;
  subText: string;
  isSelected: boolean;
  parentId?: number;
}

export interface UserDropdownItem {
  id: string;
  name: string;
  imagePath?: MediaUploadResponseModel[];
  subText: string;
  isSelected: boolean;
  parentId?: number;
}
