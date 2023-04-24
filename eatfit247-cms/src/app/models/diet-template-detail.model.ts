import {DietPlanDetail} from "./member-diet-plan.model";

export class DietPlanTemplateDetail {
  id: number;
  cycleNo: number;
  dayNo?: number;
  noOfCycle: number;
  noOfDaysInCycle: number;
  isWeekly: boolean;
  dietPlan: DietPlanDetail[];

  static fromJson(data: any): DietPlanTemplateDetail | null {
    if (!data) {
      return null;
    }
    const obj: DietPlanTemplateDetail = new DietPlanTemplateDetail();
    obj.id = data.id;
    obj.cycleNo = data.cycleNo;
    obj.dayNo = data.dayNo;
    obj.noOfCycle = data.noOfCycle;
    obj.noOfDaysInCycle = data.noOfDaysInCycle;
    obj.isWeekly = data.isWeekly;

    obj.dietPlan = [];
    for (const s of data.dietPlan) {
      obj.dietPlan.push(DietPlanDetail.fromJson(s));
    }
    return obj;
  }
}
