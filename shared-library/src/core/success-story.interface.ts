import { IAdminInfo } from '../base.interface';
import { IMediaUpload } from './media-upload.interface';

export type SuccessStoryMediaType = 'image' | 'video' | 'youtube';

export interface IBaseSuccessStory {
  name: string;
  title?: string;
  date: Date;
  description: string;
  mediaType: SuccessStoryMediaType;
  imagePath?: IMediaUpload[];
  youtubeUrl?: string;
  showOnWebsite: boolean;
  sequence: number;
}

export interface IManageSuccessStory extends IBaseSuccessStory {
  successStoryId?: number;
  active: boolean;
}

export interface ISuccessStory extends IBaseSuccessStory, IAdminInfo {
  successStoryId: number;
  active: boolean;
}
