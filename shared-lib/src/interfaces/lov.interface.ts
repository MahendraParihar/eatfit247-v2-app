import { IMediaUpload } from './media-upload.interface';
import { ICreateUpdate } from './common.interface';

export interface ILov extends ICreateUpdate {
  id: any;
  name: string;
  imagePath?: IMediaUpload[];
}
