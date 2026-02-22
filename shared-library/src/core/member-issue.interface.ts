import { IAdminInfo, IDropdownItem } from '../base.interface';

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

export interface IMemberIssue extends IBaseMemberIssue, IAdminInfo {
  memberIssueId: number;
  issueStatus: string;
  issueCategory: string;
}

export interface IBaseMemberIssueResponse {
  memberIssueId: number;
  response: string;
}

export interface IManageMemberIssueResponse extends IBaseMemberIssueResponse {
}

export interface IMemberIssueResponse extends IBaseMemberIssueResponse, IAdminInfo {
  memberIssueResponseId: number;
  isLatest: boolean;
}
