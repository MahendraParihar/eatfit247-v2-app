import { IMediaUpload } from './media-upload.interface';
import { ICreateUpdate } from './common.interface';

export interface IFaq extends ICreateUpdate {
  id: any;
  faq: string;
  answer: string;
  faqCategoryId: number;
  faqCategory: string;
  active: boolean;
  filePath?: IMediaUpload[];
}
