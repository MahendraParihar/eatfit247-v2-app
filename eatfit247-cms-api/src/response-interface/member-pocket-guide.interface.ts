import { IMediaUpload } from './media-upload.interface';
import { IAdminShortInfo } from './admin-user.interface';

export interface IMemberPocketGuide {
  id: any;
  name: string;
  description: string;
  isSelected: boolean;
  active?: boolean;
  imagePath?: IMediaUpload[];
  filePath?: IMediaUpload[];
  createdBy: IAdminShortInfo;
  updatedBy: IAdminShortInfo;
  createdAt: string;
  updatedAt: string;
}
