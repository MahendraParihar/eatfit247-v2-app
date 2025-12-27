import { IBaseAdminUser } from "../base.interface";
import { IHealthParameter } from "./assessment-master.interface";

export interface IBaseMemberHealthParameterLog {
  memberId: number;
  logDate: number;
  healthParameters: IMemberHealthParameter[];
}

export interface IManageMemberHealthParameterLog extends IBaseMemberHealthParameterLog {
  memberHealthParameterLogId?: number;
}

export interface IMemberHealthParameterLog extends IBaseMemberHealthParameterLog {
  memberHealthParameterLogId: number;
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

export interface IMemberHealthParameter {
  memberHealthParameterLogId?: number;
  healthParameterId: number;
  healthParameter: string;
  value: string;
  healthParameterUnitId: number;
  healthParameterUnit: string;
}