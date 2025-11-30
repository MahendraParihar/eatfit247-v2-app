import { IBaseAdminUser, ICommonSEO, ICommonTable } from '../base.interface';
import { IMediaUpload } from './media-upload.interface';

export interface IBaseLegalPage {
  title: string;
  details: string;
  imagePath?: IMediaUpload[];
}

export interface IManageLegalPage extends IBaseLegalPage, ICommonSEO {
  legalPageId?: number;
  active: boolean;
  uploadFiles?: IMediaUpload[];
}

export interface ILegalPage extends IBaseLegalPage, ICommonTable, ICommonSEO {
  legalPageId: number;
  active: boolean;
}

export interface ILegalPageList extends ILegalPage {
  createdByUser: IBaseAdminUser;
  updatedByUser: IBaseAdminUser;
}

