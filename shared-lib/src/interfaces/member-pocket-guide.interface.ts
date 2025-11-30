import { IMediaUpload } from './media-upload.interface';
import { ICreateUpdate } from './common.interface';

export interface IMemberPocketGuide extends ICreateUpdate {
  id: any;
  name: string;
  description: string;
  isSelected: boolean;
  imagePath?: IMediaUpload[];
  filePath?: IMediaUpload[];
}

export interface IManageMemberPocketGuide {
  pocketGuideIds: number[];
}