import { IMediaUpload } from './media-upload.interface';
import { IAdminShortInfo } from './admin-user.interface';

export interface IFaq {
  id: any;
  faq: string;
  answer: string;
  faqCategoryId: number;
  faqCategory: string;
  active: boolean;
  filePath?: IMediaUpload[];
  createdBy: IAdminShortInfo;
  updatedBy: IAdminShortInfo;
  createdAt: string;
  updatedAt: string;
}
