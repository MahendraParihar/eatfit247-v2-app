import { ICreateUpdate } from './common.interface';
import { IHealthParameterUnitMapping } from './health-parameter.interface';

export interface IMemberHealthParameterLog extends ICreateUpdate {
  id: number;
  memberId: number;
  logDate: string | Date;
  memberHealthParameters?: IMemberHealthParameter[];
}

export interface IMemberHealthParameter {
  healthParameterId: number;
  healthParameter: string;
  hintText?: string;
  healthParameterUnitId?: number;
  healthParameterUnit?: string;
  value: string;
  fieldType: string;
  requiredField: boolean;
  healthParameterUnitList: IHealthParameterUnitMapping[];
}
