import { IMediaUpload } from './media-upload.interface';
import { ICreateUpdate } from './common.interface';

export interface IProgram extends ICreateUpdate {
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
}
