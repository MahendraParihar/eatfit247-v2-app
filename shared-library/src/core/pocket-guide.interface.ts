import { IBaseAdminUser } from '../base.interface';
import { IMediaUpload } from './media-upload.interface';

export interface IBasePocketGuide {
  pocketGuide: string;
  filePath?: IMediaUpload[];
  description?: string;
  imagePath?: IMediaUpload[];
}

export interface IManagePocketGuide {
  pocketGuide: string;
  description?: string;
  pocketGuideId?: number;
  uploadFile?: IMediaUpload[];
  uploadFiles?: IMediaUpload[];
  active: boolean;
}

export interface IPocketGuide extends IBasePocketGuide {
  pocketGuideId: number;
  id?: number; // For compatibility with old interface
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

