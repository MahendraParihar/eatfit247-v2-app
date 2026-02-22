import { IAdminInfo } from '../base.interface';
import { IMediaUpload } from './media-upload.interface';

export type PressMediaType = "youtube" | "press";

export interface IBasePressMedia {
  title?: string;
  type: PressMediaType;
  link: string;
  imagePath?: IMediaUpload[];
}

export interface IManagePressMedia extends IBasePressMedia {
  pressMediaId?: number;
  active: boolean;
}

export interface IPressMedia extends IBasePressMedia, IAdminInfo {
  pressMediaId: number;
  active: boolean;
  publishDate: Date;
}

