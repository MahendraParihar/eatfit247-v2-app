import { inject, Injectable } from '@angular/core';
import { HttpService } from '@core';
import {
  IDashboardKpis,
  IEngagementData,
  IMemberGrowthData,
  IOperationsSnapshot,
  IProgramPerformanceData,
  IRevenueData
} from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class DashboardApiService {
  private readonly httpService = inject(HttpService);
  private readonly endpoint = '/reports/dashboard';

  async getKpis(): Promise<IDashboardKpis> {
    const res = await this.httpService.get<IDashboardKpis>(`${this.endpoint}/kpis`);
    if (!res || !res.data) {
      throw new Error('Invalid response format: missing data property');
    }
    return res.data as IDashboardKpis;
  }

  async getRevenueData(): Promise<IRevenueData> {
    const res = await this.httpService.get<IRevenueData>(`${this.endpoint}/revenue`);
    if (!res || !res.data) {
      throw new Error('Invalid response format: missing data property');
    }
    return res.data as IRevenueData;
  }

  async getMemberGrowthData(period: 'weekly' | 'monthly' = 'monthly'): Promise<IMemberGrowthData> {
    const res = await this.httpService.get<IMemberGrowthData>(`${this.endpoint}/members`, {
      params: { period },
    });
    if (!res || !res.data) {
      throw new Error('Invalid response format: missing data property');
    }
    return res.data as IMemberGrowthData;
  }

  async getProgramPerformanceData(): Promise<IProgramPerformanceData[]> {
    const res = await this.httpService.get<IProgramPerformanceData[]>(
      `${this.endpoint}/programs`
    );
    if (!res || !res.data) {
      throw new Error('Invalid response format: missing data property');
    }
    return res.data as IProgramPerformanceData[];
  }

  async getOperationsSnapshot(): Promise<IOperationsSnapshot> {
    const res = await this.httpService.get<IOperationsSnapshot>(`${this.endpoint}/tasks`);
    if (!res || !res.data) {
      throw new Error('Invalid response format: missing data property');
    }
    return res.data as IOperationsSnapshot;
  }

  async getEngagementData(): Promise<IEngagementData> {
    const res = await this.httpService.get<IEngagementData>(`${this.endpoint}/engagement`);
    if (!res || !res.data) {
      throw new Error('Invalid response format: missing data property');
    }
    return res.data as IEngagementData;
  }
}

