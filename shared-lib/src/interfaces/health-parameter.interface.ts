import { IMediaUpload } from './media-upload.interface';
import { ICreateUpdate } from './common.interface';

export interface IHealthParameter extends ICreateUpdate {
  id: any;
  name: string;
  hintText: string;
  fieldType: string;
  requiredField: boolean;
  isLength: boolean;
  sequence: number;
  imagePath?: IMediaUpload[];
}

export interface IHealthParameterUnitMapping {
  healthParameterId: number;
  healthParameterUnitId: number;
  healthParameterUnit: string;
  defaultSelected: boolean;
}
