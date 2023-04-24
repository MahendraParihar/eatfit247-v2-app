import {BaseModel} from "./base.model";
import {MediaUploadResponseModel} from "./media-upload-response.model";
import {AdminShortInfoModel} from "./admin-short-info.model";

export class PlanModel extends BaseModel {
  title?: string;
  details?: string;
  inrAmount: number;
  noOfCycle: number;
  noOfDaysInCycle: number;
  programPlanTypeId: number;
  programPlanType?: string;
  isOnline: boolean;
  isVisibleOnWeb: boolean;
  sequenceNumber: number;
  tags: string[];
  url: string;

  static override fromJson(data: any): PlanModel | null {
    if (!data) {
      return null;
    }
    const authUserObj: PlanModel = new PlanModel();
    authUserObj.id = data.id;
    authUserObj.title = data.title;
    authUserObj.details = data.details;
    authUserObj.inrAmount = data.inrAmount;
    authUserObj.noOfCycle = data.noOfCycle;
    authUserObj.noOfDaysInCycle = data.noOfDaysInCycle;
    authUserObj.programPlanTypeId = data.programPlanTypeId;
    authUserObj.programPlanType = data.programPlanType;
    authUserObj.isOnline = data.isOnline;
    authUserObj.isVisibleOnWeb = data.isVisibleOnWeb;
    authUserObj.sequenceNumber = data.sequenceNumber;
    authUserObj.tags = data.tags;
    authUserObj.url = data.url;
    authUserObj.active = data.active;
    authUserObj.imagePath = data.imagePath ? <MediaUploadResponseModel[]>data.imagePath : null;
    authUserObj.createdBy = AdminShortInfoModel.fromJson(data.createdBy);
    authUserObj.updatedBy = AdminShortInfoModel.fromJson(data.updatedBy);
    authUserObj.createdAt = data.createdAt;
    authUserObj.updatedAt = data.updatedAt;
    return authUserObj;
  }
}

export class PlanFees {
  id: any;
  title: string;
  inrAmount: number;
  noOfCycle: number;
  noOfDaysInCycle: number;
  isOnline: boolean;
  isTaxIncluded: boolean;

  static fromJson(data: any): PlanFees | null {
    if (!data) {
      return null;
    }
    const authUserObj: PlanFees = new PlanFees();
    authUserObj.id = data.id;
    authUserObj.title = data.title;
    authUserObj.inrAmount = data.inrAmount;
    authUserObj.noOfCycle = data.noOfCycle;
    authUserObj.noOfDaysInCycle = data.noOfDaysInCycle;
    authUserObj.isOnline = data.isOnline;
    authUserObj.isTaxIncluded = data.isTaxIncluded;
    return authUserObj;
  }
}
