import { IMediaUpload } from './media-upload.interface';
import { ICreateUpdate } from './common.interface';

export interface IState extends ICreateUpdate {
  id: any;
  name: string;
  code: string;
  country?: string;
  countryId: number;
  imagePath?: IMediaUpload[];
}
