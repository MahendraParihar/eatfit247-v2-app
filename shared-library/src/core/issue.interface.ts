import { IBaseAdminUser, ICommonTable } from '../base.interface';

// Issue Category Interfaces
export interface IBaseIssueCategory {
  issueCategory: string;
}

export interface IManageIssueCategory extends IBaseIssueCategory {
  issueCategoryId?: number;
  active: boolean;
}

export interface IIssueCategory extends IBaseIssueCategory, ICommonTable {
  issueCategoryId: number;
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

// Issue Status Interfaces
export interface IBaseIssueStatus {
  issueStatus: string;
}

export interface IManageIssueStatus extends IBaseIssueStatus {
  issueStatusId?: number;
  active: boolean;
}

export interface IIssueStatus extends IBaseIssueStatus, ICommonTable {
  issueStatusId: number;
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
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

export interface IIssue extends IBaseIssue {
  issueId: number;
  issueCategory?: IIssueCategory;
  issueStatus?: IIssueStatus;
  member?: {
    memberId: number;
    firstName?: string;
    lastName?: string;
  };
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}
