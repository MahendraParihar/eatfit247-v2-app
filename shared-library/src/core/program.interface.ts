import { IBaseAdminUser, ICommonSEO } from "../base.interface";
import { IMediaUpload } from "./media-upload.interface";

export interface IBaseProgram extends ICommonSEO {
  program: string;
  programCategoryId: number;
  url?: string;
  punchLine: string;
  details: string;
  imagePath?: IMediaUpload[];
  idealFor?: string; // Stored as string in DB, can be comma-separated
  sequenceNumber: number;
  isSpecialProgram: boolean;
  videoUrl?: string;
}

export interface IManageProgram extends IBaseProgram {
  programId?: number;
  active: boolean;
}

export interface IProgram extends IBaseProgram {
  programId: number;
  programCategory: string;
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

