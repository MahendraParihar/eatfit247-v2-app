import { IBaseAdminUser, ICommonTable, IAdminInfo } from '../base.interface';

// Issue Category Interfaces
export interface IBaseIssueCategory {
  issueCategory: string;
}

export interface IManageIssueCategory extends IBaseIssueCategory {
  issueCategoryId?: number;
  active: boolean;
}

export interface IIssueCategory extends IBaseIssueCategory, ICommonTable, IAdminInfo {
  issueCategoryId: number;
  active: boolean;
}

// Issue Status Interfaces
export interface IBaseIssueStatus {
  issueStatus: string;
}

export interface IManageIssueStatus extends IBaseIssueStatus {
  issueStatusId?: number;
  active: boolean;
}

export interface IIssueStatus extends IBaseIssueStatus, ICommonTable, IAdminInfo {
  issueStatusId: number;
  active: boolean;
}

// Issue Transaction Interface
export interface IBaseIssue {
  subject: string;
  description?: string;
  issueDate: Date;
  resolvedDate?: Date;
  issueCategoryId: number;
  issueStatusId: number;
  memberId: number;
}

export interface IManageIssue extends IBaseIssue {
  issueId?: number;
}

export interface IIssue extends IBaseIssue, IAdminInfo {
  issueId: number;
  issueCategory?: IIssueCategory;
  issueStatus?: IIssueStatus;
  member?: {
    memberId: number;
    firstName?: string;
    lastName?: string;
  };
}
