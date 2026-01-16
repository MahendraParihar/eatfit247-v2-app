/**
 * Dashboard Report Interfaces
 * Shared interfaces for dashboard reporting across frontend and backend
 */

export interface IDashboardKpis {
  totalMembers: number;
  newMembers: number;
  monthlyRevenue: number;
  pendingPayments: number;
  dietPlansSent: number;
  openIssues: number;
  trends?: {
    totalMembers?: number;
    newMembers?: number;
    monthlyRevenue?: number;
    pendingPayments?: number;
    dietPlansSent?: number;
    openIssues?: number;
  };
}

export interface IRevenueDataPoint {
  month: string;
  revenue: number;
  paid: number;
  pending: number;
}

export interface IRevenueData {
  lineChart: IRevenueDataPoint[];
  barChart: IRevenueDataPoint[];
}

export interface IMemberGrowthDataPoint {
  period: string;
  newMembers: number;
  activeMembers: number;
}

export interface IMemberGrowthData {
  data: IMemberGrowthDataPoint[];
  period: 'weekly' | 'monthly';
}

export interface IProgramPerformanceData {
  programName: string;
  enrollment: number;
  percentage: number;
}

export interface IOperationsSnapshot {
  todaysCalls: number;
  pendingAssessments: number;
  openMemberIssues: number;
  unreadIssueResponses: number;
}

export interface IEngagementData {
  dietPlansSent: number;
  dietPlansPending: number;
  assessmentCompletionPercent: number;
  avgHealthLogsPerMember: number;
}

