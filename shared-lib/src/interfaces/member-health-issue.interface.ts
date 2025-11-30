import { IMediaUpload } from './media-upload.interface';
import { ICreateUpdate } from './common.interface';

export interface IMemberHealthIssue extends ICreateUpdate {
  id: any;
  name: string;
  isSelected: boolean;
  imagePath?: IMediaUpload[];
}
