import { IMediaUpload } from './media-upload.interface';
import { IAdminShortInfo } from './admin-user.interface';

export interface IProgram {
  id: any;
  title: string;
  programCategoryId: number;
  programCategory?: string;
  punchLine: string;
  url: string;
  details: string;
  idealFor: string[];
  sequenceNumber: number;
  isSpecialProgram: boolean;
  videoUrl: string;
  tags: string[];
  active: boolean;
  imagePath: IMediaUpload[];
  createdBy: IAdminShortInfo;
  updatedBy: IAdminShortInfo;
  createdAt: string;
  updatedAt: string;
}
