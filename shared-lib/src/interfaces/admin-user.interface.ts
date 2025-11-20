import { IMediaUpload } from './media-upload.interface';

export interface IAdminUserResponse {
  firstName: string;
  lastName: string;
  imagePath: string;
  authToken: string;
}

export interface IAdminShortInfo {
  adminId: number;
  firstName: string;
  lastName: string;
  imagePath?: IMediaUpload[];
}
