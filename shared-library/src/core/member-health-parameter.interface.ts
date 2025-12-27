import { IBaseAdminUser } from '../base.interface';
import { IHealthParameter } from './assessment-master.interface';

// Health Parameter Unit interface (if not exists, we'll use a simple structure)
export interface IHealthParameterUnit {
  healthParameterUnitId: number;
  healthParameterUnit: string;
  active: boolean;
}

export interface IBaseMemberHealthParameter {
  memberHealthParameterLogId: number;
  healthParameterId: number;
  value: string;
  healthParameterUnitId?: number;
}

export interface IManageMemberHealthParameter extends IBaseMemberHealthParameter {
  memberHealthParameterId?: number;
}

export interface IMemberHealthParameter extends IBaseMemberHealthParameter {
  memberHealthParameterId: number;
  healthParameter?: IHealthParameter;
  healthParameterUnit?: IHealthParameterUnit;
}

export interface IBaseMemberHealthParameterLog {
  memberId: number;
  logDate: Date;
  active: boolean;
}

export interface IManageMemberHealthParameterLog extends IBaseMemberHealthParameterLog {
  memberHealthParameterLogId?: number;
  parameters?: IManageMemberHealthParameter[];
}

export interface IMemberHealthParameterLog extends IBaseMemberHealthParameterLog {
  memberHealthParameterLogId: number;
  parameters?: IMemberHealthParameter[];
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}
