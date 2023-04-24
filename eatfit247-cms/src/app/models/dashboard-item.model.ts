export class DashboardItemModel {
  id: number;
  name: string;
  value: number;

  static fromJson(data: any): DashboardItemModel | null {
    if (!data) {
      return null;
    }

    const dashboardObj: DashboardItemModel = new DashboardItemModel();
    dashboardObj.id = data.id;
    dashboardObj.name = data.name;
    dashboardObj.value = data.value;
    return dashboardObj;
  }
}

export class DashboardModel {
  totalDietPlans: number;
  totalMembers: number;
  totalRecipes: number;
  totalRenewedPlans: number;
  totalNewPlans: number;
  totalAverageNewPlans: number;
  memberStatusCountList: DashboardItemModel[];
  issueStatusCountList: DashboardItemModel[];
  memberProgramCountList: DashboardItemModel[];
  memberPlanCountList: DashboardItemModel[];
  paymentModeCountList: DashboardItemModel[];
  memberMonthlyCountList: DashboardMainItem[];


  static fromJson(data: any): DashboardModel | null {
    if (!data) {
      return null;
    }

    const dashboardObj: DashboardModel = new DashboardModel();
    dashboardObj.totalDietPlans = data.totalDietPlans;
    dashboardObj.totalMembers = data.totalMembers;
    dashboardObj.totalRecipes = data.totalRecipes;
    dashboardObj.totalRenewedPlans = data.totalRenewedPlans;
    dashboardObj.totalNewPlans = data.totalNewPlans;
    dashboardObj.totalAverageNewPlans = data.totalAverageNewPlans;
    dashboardObj.memberStatusCountList = this.getDBItemList(data.memberStatusCountList);
    dashboardObj.issueStatusCountList = this.getDBItemList(data.issueStatusCountList);
    dashboardObj.memberProgramCountList = this.getDBItemList(data.memberProgramCountList);
    dashboardObj.memberPlanCountList = this.getDBItemList(data.memberPlanCountList);
    dashboardObj.paymentModeCountList = this.getDBItemList(data.paymentModeCountList);
    dashboardObj.memberMonthlyCountList = this.getDBMainItemList(data.memberCountByMonthList);
    return dashboardObj;
  }

  public static getDBItemList(list: any) {
    const dbItemList: DashboardItemModel[] = [];

    if (list) {
      for (const s of list) {
        dbItemList.push(DashboardItemModel.fromJson(s));
      }
    }
    return dbItemList;
  }

  static getDBMainItemList(list: any) {
    const dbItemList: DashboardMainItem[] = [];

    if (list) {
      for (const s of list) {
        dbItemList.push(DashboardMainItem.fromJson(s));
      }
    }
    return dbItemList;
  }
}

export class DashboardMainItem {
  id: number;
  items: DashboardItemModel[];

  static fromJson(data: any): DashboardMainItem | null {
    if (!data) {
      return null;
    }

    const dashboardObj: DashboardMainItem = new DashboardMainItem();
    dashboardObj.id = data.id;
    dashboardObj.items = DashboardModel.getDBItemList(data.items);
    return dashboardObj;
  }
}
