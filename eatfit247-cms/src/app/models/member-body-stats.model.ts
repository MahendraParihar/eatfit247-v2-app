import {AdminShortInfoModel} from "./admin-short-info.model";
import {LovModel} from "./lov.model";

export class MemberHealthParameterModelLog extends LovModel {
  logDate: string;
  memberHealthParameters?: MemberHealthParameter[]

  static override fromJson(data: any): MemberHealthParameterModelLog | null {
    if (!data) {
      return null;
    }
    const authUserObj: MemberHealthParameterModelLog = new MemberHealthParameterModelLog();
    authUserObj.id = data.id;
    authUserObj.logDate = data.logDate;
    if (data.memberHealthParameters && data.memberHealthParameters.length > 0) {
      authUserObj.memberHealthParameters = [];
      for (const s of data.memberHealthParameters) {
        authUserObj.memberHealthParameters.push(MemberHealthParameter.fromJson(s));
      }
    }
    authUserObj.active = data.active;
    authUserObj.createdBy = AdminShortInfoModel.fromJson(data.createdBy);
    authUserObj.updatedBy = AdminShortInfoModel.fromJson(data.updatedBy);
    authUserObj.createdAt = data.createdAt;
    authUserObj.updatedAt = data.updatedAt;
    return authUserObj;
  }
}

export class MemberHealthParameter {
  healthParameterId: number;
  healthParameter: string;
  hintText: string;
  fieldType: string;
  requiredField: boolean;
  healthParameterUnitId: number;
  healthParameterUnit: string;
  inputValue: string;
  unitList: HealthParameterUnit[];

  static fromJson(data: any): MemberHealthParameter | null {
    const obj: MemberHealthParameter = new MemberHealthParameter();
    obj.healthParameterId = data.healthParameterId;
    obj.healthParameter = data.healthParameter;
    obj.healthParameterUnitId = data.healthParameterUnitId;
    obj.hintText = data.hintText;
    obj.fieldType = data.fieldType;
    obj.requiredField = data.requiredField;
    obj.healthParameterUnit = data.healthParameterUnit;
    obj.inputValue = data.value;
    if (data.healthParameterUnitList && data.healthParameterUnitList.length > 0) {
      obj.unitList = [];
      for (const s of data.healthParameterUnitList) {
        obj.unitList.push(HealthParameterUnit.fromJson(s));
      }
    }
    return obj;
  }
}

export class HealthParameterUnit {
  healthParameterId: number;
  healthParameterUnitId: number;
  healthParameterUnit: string;
  defaultSelected: boolean;

  static fromJson(data: any): HealthParameterUnit | null {
    const obj: HealthParameterUnit = new HealthParameterUnit();
    obj.healthParameterId = data.healthParameterId;
    obj.healthParameterUnitId = data.healthParameterUnitId;
    obj.healthParameterUnit = data.healthParameterUnit;
    obj.defaultSelected = data.defaultSelected;
    return obj;
  }
}
