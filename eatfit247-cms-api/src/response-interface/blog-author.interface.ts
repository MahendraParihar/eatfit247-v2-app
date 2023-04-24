import { IMediaUpload } from './media-upload.interface';
import { IAdminShortInfo } from './admin-user.interface';

export interface IBlogAuthor {
  id: any;
  firstName: string;
  lastName: string;
  countryCode?: string;
  contactNumber?: string;
  emailId: string;
  linkedUrl?: string;
  imagePath?: IMediaUpload[];
  active?: boolean;
  createdBy: IAdminShortInfo;
  updatedBy: IAdminShortInfo;
  createdAt: string;
  updatedAt: string;
}
