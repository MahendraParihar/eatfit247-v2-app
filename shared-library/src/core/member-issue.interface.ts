import { IBaseAdminUser, IDropdownItem } from "../base.interface";
import { IIssueStatus, IIssueCategory } from "./issue.interface";

export interface IIssueMasterData {
  categories: IDropdownItem[];
  status: IDropdownItem[];
}

export interface IBaseMemberIssue {
  memberId: number;
  issue: string;
  issueStatusId: number;
  issueCategoryId: number;
}

export interface IManageMemberIssue extends IBaseMemberIssue {
  memberIssueId?: number;
}

export interface IMemberIssue extends IBaseMemberIssue {
  memberIssueId: number;
  issueStatus: string;
  issueCategory: string;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

export interface IBaseMemberIssueResponse {
  memberIssueId: number;
  response: string;
}

export interface IManageMemberIssueResponse extends IBaseMemberIssueResponse {
}

export interface IMemberIssueResponse extends IBaseMemberIssueResponse {
  memberIssueResponseId: number;
  isLatest: boolean;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}
