export interface IDashboardItem {
  id: number;
  name: string;
  value: number;
}

export interface IDashboardModel {
  id: number;
  items: IDashboardItem[];
}
