import { IMediaUpload } from './media-upload.interface';
import { ICreateUpdate } from './common.interface';

export interface IBlogCategory extends ICreateUpdate {
  id: any;
  blogCategory: string;
  url: string;
  imagePath?: IMediaUpload[];
}
