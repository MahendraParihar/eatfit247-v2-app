export interface IMemberIssueReportFilter {
  startDate: string;
  endDate: string;
  search?: string;
  issueStatusId?: number;
  issueCategoryId?: number;
  isOpen?: boolean;
}

export interface IMemberIssueReportItem {
  memberIssueId: number;
  memberId: number;
  memberName: string;
  memberEmail: string;
  memberContactNumber: string;
  issue: string;
  issueStatusId: number;
  issueStatus: string;
  issueCategoryId: number;
  issueCategory: string;
  hasResponse: boolean;
  lastResponseDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdByUser?: {
    adminId: number;
    firstName: string;
    lastName: string;
  };
  updatedByUser?: {
    adminId: number;
    firstName: string;
    lastName: string;
  };
}

