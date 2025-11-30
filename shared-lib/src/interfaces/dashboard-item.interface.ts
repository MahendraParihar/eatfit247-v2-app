export interface IDashboardItem {
  id: number;
  name: string;
  value: number;
}

export interface IDashboardModel {
  id: number;
  items: IDashboardItem[];
}

export interface IDashboardCount {
  totalDietPlans:number;
  totalMembers:number;
  totalRecipes:number;
  totalRenewedPlans:number;
  totalNewPlans:number;
  totalAverageNewPlans:number;
  memberStatusCountList:IDashboardItem[];
  issueStatusCountList:IDashboardItem[];
  memberProgramCountList:IDashboardItem[];
  memberPlanCountList:IDashboardItem[];
  paymentModeCountList:IDashboardItem[];
  memberCountByMonthList:IDashboardModel[];
}
