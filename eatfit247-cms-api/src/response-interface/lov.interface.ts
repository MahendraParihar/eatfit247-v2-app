import { IMediaUpload } from './media-upload.interface';
import { IAdminShortInfo } from './admin-user.interface';

export interface ICreateUpdate {
  active?: boolean;
  createdBy: IAdminShortInfo;
  updatedBy: IAdminShortInfo;
  createdAt: string;
  updatedAt: string;
}

export interface ILov extends ICreateUpdate {
  id: any;
  name: string;
  imagePath?: IMediaUpload[];
}
