import { IBaseAdminUser } from '../base.interface';
import { IMediaUpload } from './media-upload.interface';

export interface IBaseProgram {
  program: string;
  programCategoryId: number;
  url: string;
  punchLine: string;
  details: string;
  imagePath?: IMediaUpload[];
  idealFor?: string; // Stored as string in DB, can be comma-separated
  sequenceNumber: number;
  isSpecialProgram: boolean;
  videoUrl?: string;
  tags?: string; // Stored as string in DB, can be comma-separated
  metaTitle?: string;
  metaDescription?: string;
}

export interface IManageProgram {
  program: string;
  programCategoryId: number;
  url?: string; // Optional because it can be auto-generated
  punchLine: string;
  details: string;
  idealFor?: string;
  sequenceNumber: number;
  isSpecialProgram: boolean;
  videoUrl?: string;
  tags?: string;
  metaTitle?: string;
  metaDescription?: string;
  programId?: number;
  uploadFiles?: IMediaUpload[];
  active: boolean;
}

export interface IProgram extends IBaseProgram {
  programId: number;
  id?: number; // For compatibility with old interface
  programCategory: string;
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

