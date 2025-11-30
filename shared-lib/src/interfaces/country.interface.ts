import { IMediaUpload } from './media-upload.interface';
import { ICreateUpdate } from './common.interface';

export interface ICountry extends ICreateUpdate {
  id: any;
  name: string;
  countryCode: string;
  phoneNumberCode: string;
  imagePath?: IMediaUpload[];
}
