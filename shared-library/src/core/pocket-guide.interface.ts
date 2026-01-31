import { IBaseAdminUser, IAdminInfo } from "../base.interface";
import { IMediaUpload } from "./media-upload.interface";

export interface IBasePocketGuide {
  pocketGuide: string;
  filePath?: IMediaUpload[];
  description?: string;
  imagePath?: IMediaUpload[];
}

export interface IManagePocketGuide extends IBasePocketGuide {
  pocketGuideId?: number;
  active: boolean;
}

export interface IPocketGuide extends IBasePocketGuide, IAdminInfo {
  pocketGuideId: number;
  active: boolean;
}

