import { IMediaUpload } from './media-upload.interface';
import { IAdminShortInfo } from './admin-user.interface';

export interface IHealthParameter {
  id: any;
  name: string;
  hintText: string;
  fieldType: string;
  requiredField: boolean;
  sequence: number;
  active?: boolean;
  imagePath?: IMediaUpload[];
  createdBy: IAdminShortInfo;
  updatedBy: IAdminShortInfo;
  createdAt: string;
  updatedAt: string;
}

export interface IHealthParameterUnitMapping {
  healthParameterId: number;
  healthParameterUnitId: number;
  healthParameterUnit: string;
  defaultSelected: boolean;
}
