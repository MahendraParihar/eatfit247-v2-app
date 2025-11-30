import { IBaseAdminUser } from '../base.interface';
import { IMediaUpload } from './media-upload.interface';

export type PressMediaType = 'youtube' | 'press';

export interface IBasePressMedia {
  title?: string;
  type: PressMediaType;
  link: string;
  imagePath?: IMediaUpload[];
}

export interface IManagePressMedia extends IBasePressMedia {
  pressMediaId?: number;
  active: boolean;
  uploadFiles?: IMediaUpload[];
}

export interface IPressMedia extends IBasePressMedia {
  pressMediaId: number;
  id?: number; // For compatibility with old interface
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

