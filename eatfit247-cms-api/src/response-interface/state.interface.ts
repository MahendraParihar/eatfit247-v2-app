import { IMediaUpload } from './media-upload.interface';
import { IAdminShortInfo } from './admin-user.interface';

export interface IState {
  id: any;
  name: string;
  code: string;
  country?: string;
  countryId: number;
  active?: boolean;
  imagePath?: IMediaUpload[];
  createdBy: IAdminShortInfo;
  updatedBy: IAdminShortInfo;
  createdAt: string;
  updatedAt: string;
}
