import { IAdminShortInfo } from './admin-user.interface';

export interface IHealthParameterUnit {
  id: any;
  name: string;
  active?: boolean;
  createdBy: IAdminShortInfo;
  updatedBy: IAdminShortInfo;
  createdAt: string;
  updatedAt: string;
}
