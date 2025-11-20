import { IAdminShortInfo } from './admin-user.interface';
import { IHealthParameterUnitMapping } from './health-parameter.interface';

export interface IMemberHealthParameterLog {
  id: number;
  memberId: number;
  logDate: string | Date;
  active?: boolean;
  createdBy: IAdminShortInfo;
  updatedBy: IAdminShortInfo;
  createdAt: string;
  updatedAt: string;
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
