import { IBaseAdminUser, IAdminInfo } from '../base.interface';
import { IMediaUpload } from './media-upload.interface';

export interface IBaseProgramCategory {
  programCategory: string;
  url?: string;
  imagePath?: IMediaUpload[];
}

export interface IManageProgramCategory extends IBaseProgramCategory {
  programCategoryId?: number;
  active: boolean;
  uploadFiles?: IMediaUpload[];
}

export interface IProgramCategory extends IBaseProgramCategory, IAdminInfo {
  programCategoryId: number;
  active: boolean;
}

