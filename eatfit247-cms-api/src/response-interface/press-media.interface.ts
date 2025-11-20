import { IMediaUpload } from './media-upload.interface';
import { IAdminShortInfo } from './admin-user.interface';

export interface IPressMedia {
  id: number;
  title?: string;
  type: 'youtube' | 'press';
  link: string;
  active: boolean;
  imagePath: IMediaUpload[];
  createdBy: IAdminShortInfo;
  updatedBy: IAdminShortInfo;
  createdAt: string;
  updatedAt: string;
}

