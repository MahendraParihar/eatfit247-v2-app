import { IMediaUpload } from './media-upload.interface';
import { ICreateUpdate } from './common.interface';

export interface IBlogAuthor extends ICreateUpdate {
  id: any;
  firstName: string;
  lastName: string;
  countryCode?: string;
  contactNumber?: string;
  emailId: string;
  linkedUrl?: string;
  imagePath?: IMediaUpload[];
}
