import { IMediaUpload } from './media-upload.interface';
import { ICreateUpdate } from './common.interface';

export interface IRecipeCategory extends ICreateUpdate {
  id: any;
  name: string;
  fromTime?: string;
  toTime?: string;
  sequence?: number;
  imagePath?: IMediaUpload[];
}
