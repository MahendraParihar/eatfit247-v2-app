import { IBaseAdminUser, ICommonSEO, IAdminInfo } from "../base.interface";
import { IMediaUpload } from "./media-upload.interface";

export interface IBaseProgram {
  program: string;
  programCategoryId: number;
  punchLine: string;
  details: string;
  imagePath?: IMediaUpload[];
  idealFor?: string; // Stored as a string in DB, can be comma-separated
  sequenceNumber: number;
  isSpecialProgram: boolean;
  videoUrl?: string;
  seo: ICommonSEO;
}

export interface IManageProgram extends IBaseProgram {
  programId?: number;
  active: boolean;
}

export interface IProgram extends IBaseProgram, IAdminInfo {
  programId: number;
  programCategory: string;
  active: boolean;
}

