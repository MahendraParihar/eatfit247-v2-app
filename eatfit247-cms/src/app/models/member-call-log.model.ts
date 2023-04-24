import {AdminShortInfoModel} from "./admin-short-info.model";
import {LovModel} from "./lov.model";

export class MemberCallLogModel extends LovModel {
  callPurposeId: number;
  callLogStatusId: number;
  callTypeId: number;
  callPurpose?: string;
  callLogStatus?: string;
  callType?: string;
  detail?: string;
  conversionHistory?: string;
  date: string;
  startTime: string;
  endTime: string;

  static override fromJson(data: any): MemberCallLogModel | null {
    if (!data) {
      return null;
    }
    const authUserObj: MemberCallLogModel = new MemberCallLogModel();
    authUserObj.id = data.id;
    authUserObj.callPurposeId = data.callPurposeId;
    authUserObj.callLogStatusId = data.callLogStatusId;
    authUserObj.callTypeId = data.callTypeId;
    authUserObj.callPurpose = data.callPurpose;
    authUserObj.callLogStatus = data.callLogStatus;
    authUserObj.callType = data.callType;
    authUserObj.detail = data.detail;
    authUserObj.conversionHistory = data.conversionHistory;
    authUserObj.date = data.date;
    authUserObj.startTime = data.startTime;
    authUserObj.endTime = data.endTime;
    authUserObj.active = data.active;
    authUserObj.createdBy = AdminShortInfoModel.fromJson(data.createdBy);
    authUserObj.updatedBy = AdminShortInfoModel.fromJson(data.updatedBy);
    authUserObj.createdAt = data.createdAt;
    authUserObj.updatedAt = data.updatedAt;
    return authUserObj;
  }
}
