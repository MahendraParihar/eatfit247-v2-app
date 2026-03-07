import {IAdminInfo, IDropdownItem} from "../../base.interface";

export interface IBasicMemberHealthParameter {
  healthParameterId: number;
  value: string;
  healthParameterUnitId: number;
}

export interface IMemberHealthParameter extends IBasicMemberHealthParameter {
  memberHealthParameterLogId: number;
  healthParameter: string;
  healthParameterUnit: string;
}

export interface IBaseMemberHealthParameterLog {
  memberId: number;
  logDate: Date;
}

export interface IManageMemberHealthParameterLog extends IBaseMemberHealthParameterLog {
  memberHealthParameterLogId?: number;
  healthParameters: IBasicMemberHealthParameter[];
}

export interface IMemberHealthParameterLog
  extends IBaseMemberHealthParameterLog, IAdminInfo {
  healthParameters: IMemberHealthParameter[];
  memberHealthParameterLogId: number;
  active: boolean;
}

export interface IHealthParameterMaster {
  healthParameters: IDropdownItem[];
  healthParameterUnits: IDropdownItem[];
}