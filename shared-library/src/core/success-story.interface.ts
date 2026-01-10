import { IBaseAdminUser } from '../base.interface';
import { IMediaUpload } from './media-upload.interface';

export interface IBaseSuccessStory {
  name: string;
  title?: string;
  date: Date;
  description: string;
  imagePath?: IMediaUpload[];
}

export interface IManageSuccessStory extends IBaseSuccessStory {
  successStoryId?: number;
  active: boolean;
}

export interface ISuccessStory extends IBaseSuccessStory {
  successStoryId: number;
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

