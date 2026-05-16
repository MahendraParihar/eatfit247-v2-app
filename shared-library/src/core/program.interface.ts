import { IAdminInfo, ICommonSEO } from '../base.interface';
import { IMediaUpload } from './media-upload.interface';

export interface IBaseProgram {
  program: string;
  punchLine: string;
  details: string;
  imagePath?: IMediaUpload[];
  idealFor?: string; // Stored as a string in DB, can be comma-separated
  sequenceNumber: number;
  isSpecialProgram: boolean;
  videoUrl?: string;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  maxPeopleCanRegister?: number | null;
  seo: ICommonSEO;
}

export interface IManageProgram extends IBaseProgram {
  programId?: number;
  active: boolean;
}

export interface IProgram extends IBaseProgram, IAdminInfo {
  programId: number;
  active: boolean;
}
