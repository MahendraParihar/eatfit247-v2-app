import {AdminShortInfoModel} from "./admin-short-info.model";
import {LovModel} from "./lov.model";
import {DropdownItem} from "../interfaces/dropdown-item";

export class MemberDietPlanModel extends LovModel {
  program: string;
  programCategory: string;
  memberId: number;
  noOfCycle: number;
  noOfDaysInCycle: number;
  currentCycleNo?: number;
  currentDayNo?: number;
  isCompleted: boolean;
  startDate: string;
  endDate: string;
  deletable: boolean;
  dietPlanStatusId: number;
  dietPlanStatus: string;
  upcomingDay?: number;
  upcomingCycle?: number;
  showActionBtn: boolean;
  showDaily: boolean;
  showWeekly: boolean;
  cyclePlans: CyclePlan[];

  static override fromJson(data: any): MemberDietPlanModel | null {
    if (!data) {
      return null;
    }
    const authUserObj: MemberDietPlanModel = new MemberDietPlanModel();
    authUserObj.id = data.id;
    authUserObj.program = data.program;
    authUserObj.programCategory = data.programCategory;
    authUserObj.memberId = data.memberId;
    authUserObj.startDate = data.startDate;
    authUserObj.endDate = data.endDate;
    authUserObj.noOfCycle = data.noOfCycle;
    authUserObj.noOfDaysInCycle = data.noOfDaysInCycle;
    authUserObj.currentCycleNo = data.currentCycleNo ? data.currentCycleNo : null;
    authUserObj.currentDayNo = data.currentDayNo ? data.currentDayNo : null;
    authUserObj.deletable = data.deletable;
    authUserObj.dietPlanStatusId = data.dietPlanStatusId;
    authUserObj.dietPlanStatus = data.dietPlanStatus;
    authUserObj.createdBy = AdminShortInfoModel.fromJson(data.createdBy);
    authUserObj.updatedBy = AdminShortInfoModel.fromJson(data.updatedBy);
    authUserObj.createdAt = data.createdAt;
    authUserObj.updatedAt = data.updatedAt;
    authUserObj.upcomingDay = data.upcomingDay ? data.upcomingDay : null;
    authUserObj.upcomingCycle = data.upcomingCycle ? data.upcomingCycle : null;
    authUserObj.showActionBtn = data.showActionBtn;
    authUserObj.showDaily = data.showDaily;
    authUserObj.showWeekly = data.showWeekly;
    authUserObj.cyclePlans = [];
    for (const s of data.cyclePlans) {
      authUserObj.cyclePlans.push(CyclePlan.fromJson(s));
    }
    return authUserObj;
  }
}

export class DietPlanDetail {
  recipeCategoryId: number;
  recipeCategory: string;
  dietDetail: string;
  sequence: number;
  recipeIds: number[];
  recipeList: DropdownItem[];

  static fromJson(data: any): DietPlanDetail | null {
    if (!data) {
      return null;
    }
    const obj: DietPlanDetail = new DietPlanDetail();
    obj.recipeCategoryId = data.recipeCategoryId;
    obj.recipeCategory = data.recipeCategory;
    obj.dietDetail = data.dietDetail;
    obj.sequence = data.sequence;
    obj.recipeIds = data.recipeIds;
    if (data.recipeList && data.recipeList.length > 0) {
      obj.recipeList = [];
      for (const s of data.recipeList) {
        obj.recipeList.push(DropdownItem.fromJson(s));
      }
    }
    return obj;
  }
}

export class MemberDietDetail {
  id: number;
  dietPlanId: number;
  startDate?: moment.Moment;
  endDate?: moment.Moment;
  cycleNo: number;
  dayNo?: number;
  noOfCycle: number;
  noOfDaysInCycle: number;
  dietPlan: DietPlanDetail[];

  static fromJson(data: any): MemberDietDetail | null {
    if (!data) {
      return null;
    }
    const obj: MemberDietDetail = new MemberDietDetail();
    obj.id = data.id;
    obj.dietPlanId = data.dietPlanId;
    obj.startDate = data.startDate;
    obj.endDate = data.endDate;
    obj.cycleNo = data.cycleNo;
    obj.dayNo = data.dayNo;
    obj.noOfCycle = data.noOfCycle;
    obj.noOfDaysInCycle = data.noOfDaysInCycle;
    obj.dietPlan = [];
    for (const s of data.dietPlan) {
      obj.dietPlan.push(DietPlanDetail.fromJson(s));
    }
    return obj;
  }
}

export class CyclePlan {
  cycleNo: number;
  startDate: moment.Moment;
  endDate: moment.Moment;
  type: string;
  dietPlans: MemberDietDetail[];

  static fromJson(data: any): CyclePlan | null {
    if (!data) {
      return null;
    }
    const authUserObj: CyclePlan = new CyclePlan();
    authUserObj.startDate = data.startDate;
    authUserObj.endDate = data.endDate;
    authUserObj.cycleNo = data.cycleNo;
    authUserObj.type = data.type;
    if (data.dietPlans && data.dietPlans.length > 0) {
      authUserObj.dietPlans = [];
      for (const s of data.dietPlans) {
        authUserObj.dietPlans.push(MemberDietDetail.fromJson(s));
      }
    }
    authUserObj.dietPlans = data.dietPlans;
    return authUserObj;
  }
}
