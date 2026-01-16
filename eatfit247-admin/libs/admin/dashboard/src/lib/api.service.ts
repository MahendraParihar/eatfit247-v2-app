import { Injectable } from '@angular/core';
import { ApiBaseService, HttpService } from '@core';

export interface DashboardKpis {
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

export interface RevenueDataPoint {
  month: string;
  revenue: number;
  paid: number;
  pending: number;
}

export interface RevenueData {
  lineChart: RevenueDataPoint[];
  barChart: RevenueDataPoint[];
}

export interface MemberGrowthDataPoint {
  period: string;
  newMembers: number;
  activeMembers: number;
}

export interface MemberGrowthData {
  data: MemberGrowthDataPoint[];
  period: 'weekly' | 'monthly';
}

export interface ProgramPerformanceData {
  programName: string;
  enrollment: number;
  percentage: number;
}

export interface OperationsSnapshot {
  todaysCalls: number;
  pendingAssessments: number;
  openMemberIssues: number;
  unreadIssueResponses: number;
}

export interface EngagementData {
  dietPlansSent: number;
  dietPlansPending: number;
  assessmentCompletionPercent: number;
  avgHealthLogsPerMember: number;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardApiService extends ApiBaseService {
  private readonly endpoint = '/reports/dashboard';

  constructor(httpService: HttpService) {
    super(httpService);
  }

  async getKpis(): Promise<DashboardKpis> {
    const res = await this.httpService.get<DashboardKpis>(`${this.endpoint}/kpis`);
    if (!res || !res.data) {
      throw new Error('Invalid response format: missing data property');
    }
    return res.data as DashboardKpis;
  }

  async getRevenueData(): Promise<RevenueData> {
    const res = await this.httpService.get<RevenueData>(`${this.endpoint}/revenue`);
    if (!res || !res.data) {
      throw new Error('Invalid response format: missing data property');
    }
    return res.data as RevenueData;
  }

  async getMemberGrowthData(period: 'weekly' | 'monthly' = 'monthly'): Promise<MemberGrowthData> {
    const res = await this.httpService.get<MemberGrowthData>(`${this.endpoint}/members`, {
      params: { period },
    });
    if (!res || !res.data) {
      throw new Error('Invalid response format: missing data property');
    }
    return res.data as MemberGrowthData;
  }

  async getProgramPerformanceData(): Promise<ProgramPerformanceData[]> {
    const res = await this.httpService.get<ProgramPerformanceData[]>(
      `${this.endpoint}/programs`
    );
    if (!res || !res.data) {
      throw new Error('Invalid response format: missing data property');
    }
    return res.data as ProgramPerformanceData[];
  }

  async getOperationsSnapshot(): Promise<OperationsSnapshot> {
    const res = await this.httpService.get<OperationsSnapshot>(`${this.endpoint}/tasks`);
    if (!res || !res.data) {
      throw new Error('Invalid response format: missing data property');
    }
    return res.data as OperationsSnapshot;
  }

  async getEngagementData(): Promise<EngagementData> {
    const res = await this.httpService.get<EngagementData>(`${this.endpoint}/engagement`);
    if (!res || !res.data) {
      throw new Error('Invalid response format: missing data property');
    }
    return res.data as EngagementData;
  }
}

