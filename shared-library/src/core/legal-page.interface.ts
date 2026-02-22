import { IAdminInfo, IBaseAdminUser, ICommonSEO, ICommonTable } from '../base.interface';
import { IMediaUpload } from './media-upload.interface';

export interface IBaseLegalPage {
  title: string;
  details: string;
  imagePath?: IMediaUpload[];
}

export interface IManageLegalPage extends IBaseLegalPage {
  legalPageId?: number;
  active: boolean;
  uploadFiles?: IMediaUpload[];
  seo: ICommonSEO;
}

export interface ILegalPage extends IBaseLegalPage, ICommonTable, ICommonSEO {
  legalPageId: number;
  active: boolean;
}

export interface ILegalPageList extends ILegalPage, IAdminInfo {
  createdByUser: IBaseAdminUser; // Required, overriding IAdminInfo's optional field
  updatedByUser: IBaseAdminUser; // Required, overriding IAdminInfo's optional field
}

export interface IPublicLegalPage extends IBaseLegalPage {
  url: string;
}

