import { IBaseAdminUser } from '../base.interface';

export interface IBaseMemberHealthIssue {
  memberId: number;
  healthIssueId: number;
}

export interface IManageMemberHealthIssue extends IBaseMemberHealthIssue {
  memberHealthIssueId?: number;
}

export interface IMemberHealthIssue extends IBaseMemberHealthIssue {
  memberHealthIssueId?: number;
  healthIssue: string; // Health issue name for display
  isSelected?: boolean;
  createdBy?: number;
  modifiedBy?: number;
  createdAt?: Date;
  updatedAt?: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}
