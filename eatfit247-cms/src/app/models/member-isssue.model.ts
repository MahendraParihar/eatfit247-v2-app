import {AdminShortInfoModel} from "./admin-short-info.model";

export class MemberIssueModel {
  issueId: number;
  issueResponseId: number;
  issueCategoryId: number;
  issueStatusId: number;
  issue: string;
  status: string;
  category: string;
  response?: string;
  memberIssueResponseId?: number;
  createdAt?: string;
  createdBy: AdminShortInfoModel;
  respondedAt?: string;
  respondedBy?: AdminShortInfoModel;


  static fromJson(data: any): MemberIssueModel | null {
    if (!data) {
      return null;
    }
    const issueObj: MemberIssueModel = new MemberIssueModel();
    issueObj.issueId = data.memberIssueId;
    issueObj.issueResponseId = data.issueResponseId;
    issueObj.issueCategoryId = data.issueCategoryId;
    issueObj.issueStatusId = data.issueStatusId;
    issueObj.issue = data.issue;
    issueObj.status = data.MemberIssueStatus?.issueStatus;
    issueObj.category = data.MemberIssueCategory?.issueCategory;
    issueObj.response = data.txn_member_issue_response?.response;
    issueObj.memberIssueResponseId = data.txn_member_issue_response?.memberIssueResponseId;
    issueObj.createdBy = AdminShortInfoModel.fromJson(data.CreatedBy);
    issueObj.respondedBy = AdminShortInfoModel.fromJson(data.txn_member_issue_response?.ModifiedBy);
    issueObj.createdAt = data.createdAt;
    issueObj.respondedAt = data.txn_member_issue_response?.updatedAt;
    return issueObj;
  }
}
