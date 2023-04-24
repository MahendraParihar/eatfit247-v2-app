import { IMediaUpload } from './media-upload.interface';
import { IAdminShortInfo } from './admin-user.interface';

export interface IMemberHealthIssue {
  id: any;
  name: string;
  isSelected: boolean;
  active?: boolean;
  imagePath?: IMediaUpload[];
  createdBy: IAdminShortInfo;
  updatedBy: IAdminShortInfo;
  createdAt: string;
  updatedAt: string;
}
