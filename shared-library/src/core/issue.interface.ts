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
  id?: number; // For compatibility with old interface
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
  id?: number; // For compatibility with old interface
  active: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

