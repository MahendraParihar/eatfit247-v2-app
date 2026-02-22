import { IAdminInfo } from '../base.interface';
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

export interface ISuccessStory extends IBaseSuccessStory, IAdminInfo {
  successStoryId: number;
  active: boolean;
}

