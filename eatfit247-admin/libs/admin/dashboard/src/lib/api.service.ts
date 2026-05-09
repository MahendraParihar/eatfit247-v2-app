import { inject, Injectable } from '@angular/core';
import { HttpService } from '@core';
import {
  IAccountKpis,
  IContentKpis,
  IDashboardKpis,
  IEngagementData,
  IExpiringDietPlan,
  IFranchiseKpis,
  IMemberGrowthData,
  INutritionistKpis,
  IOperationsSnapshot,
  IOrdersByStatus,
  IPaymentCollectionStatus,
  IProgramPerformanceData,
  IRecentContentActivity,
  IRevenueData,
  IShippingKpis,
  ITaxSummary,
  IUpcomingAppointment,
} from '@eatfit247-shared-lib';

@Injectable({
  providedIn: 'root',
})
export class DashboardApiService {
  private readonly httpService = inject(HttpService);
  private readonly endpoint = '/reports/dashboard';

  // ---- Existing (Business / SuperAdmin) ----

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
      `${this.endpoint}/programs`,
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

  // ---- Nutritionist ----

  async getNutritionistKpis(): Promise<INutritionistKpis> {
    const res = await this.httpService.get<INutritionistKpis>(
      `${this.endpoint}/nutritionist-kpis`,
    );
    if (!res || !res.data) {
      throw new Error('Invalid response format: missing data property');
    }
    return res.data as INutritionistKpis;
  }

  async getUpcomingAppointments(): Promise<IUpcomingAppointment[]> {
    const res = await this.httpService.get<IUpcomingAppointment[]>(
      `${this.endpoint}/upcoming-appointments`,
    );
    if (!res || !res.data) {
      throw new Error('Invalid response format: missing data property');
    }
    return res.data as IUpcomingAppointment[];
  }

  async getExpiringDietPlans(): Promise<IExpiringDietPlan[]> {
    const res = await this.httpService.get<IExpiringDietPlan[]>(
      `${this.endpoint}/expiring-diet-plans`,
    );
    if (!res || !res.data) {
      throw new Error('Invalid response format: missing data property');
    }
    return res.data as IExpiringDietPlan[];
  }

  // ---- Finance / Account ----

  async getAccountKpis(): Promise<IAccountKpis> {
    const res = await this.httpService.get<IAccountKpis>(`${this.endpoint}/account-kpis`);
    if (!res || !res.data) {
      throw new Error('Invalid response format: missing data property');
    }
    return res.data as IAccountKpis;
  }

  async getTaxSummary(): Promise<ITaxSummary> {
    const res = await this.httpService.get<ITaxSummary>(`${this.endpoint}/tax-summary`);
    if (!res || !res.data) {
      throw new Error('Invalid response format: missing data property');
    }
    return res.data as ITaxSummary;
  }

  async getPaymentCollectionStatus(): Promise<IPaymentCollectionStatus> {
    const res = await this.httpService.get<IPaymentCollectionStatus>(
      `${this.endpoint}/payment-collection`,
    );
    if (!res || !res.data) {
      throw new Error('Invalid response format: missing data property');
    }
    return res.data as IPaymentCollectionStatus;
  }

  // ---- Shipping / Product ----

  async getShippingKpis(): Promise<IShippingKpis> {
    const res = await this.httpService.get<IShippingKpis>(`${this.endpoint}/shipping-kpis`);
    if (!res || !res.data) {
      throw new Error('Invalid response format: missing data property');
    }
    return res.data as IShippingKpis;
  }

  async getOrdersByStatus(): Promise<IOrdersByStatus[]> {
    const res = await this.httpService.get<IOrdersByStatus[]>(
      `${this.endpoint}/orders-by-status`,
    );
    if (!res || !res.data) {
      throw new Error('Invalid response format: missing data property');
    }
    return res.data as IOrdersByStatus[];
  }

  async getMonthlyOrderVolume(): Promise<{ data: { month: string; orders: number }[] }> {
    const res = await this.httpService.get<{ data: { month: string; orders: number }[] }>(
      `${this.endpoint}/monthly-order-volume`,
    );
    if (!res || !res.data) {
      throw new Error('Invalid response format: missing data property');
    }
    return res.data as { data: { month: string; orders: number }[] };
  }

  // ---- Franchise ----

  async getFranchiseKpis(): Promise<IFranchiseKpis> {
    const res = await this.httpService.get<IFranchiseKpis>(`${this.endpoint}/franchise-kpis`);
    if (!res || !res.data) {
      throw new Error('Invalid response format: missing data property');
    }
    return res.data as IFranchiseKpis;
  }

  // ---- Content ----

  async getContentKpis(): Promise<IContentKpis> {
    const res = await this.httpService.get<IContentKpis>(`${this.endpoint}/content-kpis`);
    if (!res || !res.data) {
      throw new Error('Invalid response format: missing data property');
    }
    return res.data as IContentKpis;
  }

  async getRecentContentActivity(): Promise<IRecentContentActivity[]> {
    const res = await this.httpService.get<IRecentContentActivity[]>(
      `${this.endpoint}/recent-content`,
    );
    if (!res || !res.data) {
      throw new Error('Invalid response format: missing data property');
    }
    return res.data as IRecentContentActivity[];
  }
}
