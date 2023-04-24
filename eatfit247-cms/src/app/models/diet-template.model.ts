import {BaseModel} from "./base.model";
import {AdminShortInfoModel} from "./admin-short-info.model";

export class DietTemplateModel extends BaseModel {
  title: string;
  noOfCycle: number;
  noOfDaysInCycle: number;
  isWeekly: boolean;

  static override fromJson(data: any): DietTemplateModel | null {
    if (!data) {
      return null;
    }
    const authUserObj: DietTemplateModel = new DietTemplateModel();
    authUserObj.id = data.id;
    authUserObj.title = data.name;
    authUserObj.noOfCycle = data.noOfCycle;
    authUserObj.noOfDaysInCycle = data.noOfDaysInCycle;
    authUserObj.isWeekly = data.isWeekly;
    authUserObj.active = data.active;
    authUserObj.createdBy = AdminShortInfoModel.fromJson(data.createdBy);
    authUserObj.updatedBy = AdminShortInfoModel.fromJson(data.updatedBy);
    authUserObj.createdAt = data.createdAt;
    authUserObj.updatedAt = data.updatedAt;
    return authUserObj;
  }
}
