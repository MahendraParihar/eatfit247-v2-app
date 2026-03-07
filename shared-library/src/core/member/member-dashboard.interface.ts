import { IMember } from './member.interface';
import { IMemberAssessment } from './member-assessment.interface';
import { IMemberHealthParameterLog } from './member-health-parameter.interface';
import { IMemberPayment } from './member-payment.interface';

export interface IMemberDashboardSummary {
  member: IMember;
  payments: {
    total: number;
    totalPaid: number;
    totalPending: number;
  };
  issues: {
    total: number;
    open: number;
  };
  dietPlans: {
    total: number;
    active: number;
  };
  healthLogs: {
    total: number;
  };
}

export interface IMemberHealthProgress {
  assessment: IMemberAssessment | null;
  latestHealthLogs: IMemberHealthParameterLog[];
  totalLogs: number;
  recentLogs: IMemberHealthParameterLog[];
}

export interface IMemberEngagement {
  assessment: {
    completed: boolean;
    completionRate: number;
  };
  healthLogs: {
    total: number;
    recent: number;
    frequency: number;
  };
  dietPlans: {
    total: number;
    active: number;
    engagement: number;
  };
  assessmentCompletion: number;
  healthLogFrequency: number;
}

export interface IMemberPaymentsSummary {
  summary: {
    totalPaid: number;
    totalPending: number;
    paidCount: number;
    pendingCount: number;
  };
  recentPayments: IMemberPayment[];
  totalPayments: number;
}

export interface IMemberIssuesSummary {
  summary: {
    total: number;
    open: number;
    resolved: number;
  };
  recentIssues: Array<{
    memberIssueId: number;
    memberId: number;
    issue: string;
    issueStatusId: number;
    issueCategoryId: number;
    issueStatus?: {
      issueStatusId: number;
      issueStatus: string;
    };
    issueCategory?: {
      issueCategoryId: number;
      issueCategory: string;
    };
    createdBy?: number;
    modifiedBy?: number;
    createdAt?: Date;
    updatedAt?: Date;
  }>;
  totalIssues: number;
}

