import { IMediaUpload } from './media-upload.interface';
import { ICreateUpdate } from './common.interface';

export interface IPressMedia extends ICreateUpdate {
  id: number;
  title?: string;
  type: 'youtube' | 'press';
  link: string;
  active: boolean;
  imagePath: IMediaUpload[];
}

