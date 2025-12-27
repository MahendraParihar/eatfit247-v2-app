import { IBaseAdminUser } from '../base.interface';
import { IHealthIssue } from './assessment-master.interface';

export interface IBaseMemberHealthIssue {
  memberId: number;
  healthIssueId: number;
}

export interface IManageMemberHealthIssue extends IBaseMemberHealthIssue {
  memberHealthIssueId?: number;
}

export interface IMemberHealthIssue extends IBaseMemberHealthIssue {
  memberHealthIssueId: number;
  healthIssue?: IHealthIssue;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}
