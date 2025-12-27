import { IBaseAdminUser } from "../base.interface";
import { IIssueStatus, IIssueCategory } from "./issue.interface";

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
  isLatest: boolean;
}

export interface IManageMemberIssueResponse extends IBaseMemberIssueResponse {
  memberIssueResponseId?: number;
}

export interface IMemberIssueResponse extends IBaseMemberIssueResponse {
  memberIssueResponseId: number;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}
