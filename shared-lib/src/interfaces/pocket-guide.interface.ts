import { IMediaUpload } from "./media-upload.interface";
import { ICreateUpdate } from "./common.interface";

export interface IPocketGuide extends ICreateUpdate {
  id: any;
  name: string;
  description: string;
  imagePath?: IMediaUpload[];
  filePath?: IMediaUpload[];
}

export class IManagePocketGuide {
  name: string;
  description?: string;
  uploadFiles?: IMediaUpload[];
  uploadAttachment?: IMediaUpload[];
  active: boolean;
}