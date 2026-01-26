import { inject, Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { IPublicTableList } from 'eatfit247-shared-library';

export interface ProgramPlan {
  programPlanId: number;
  plan: string;
  url: string;
  details: string;
  sequenceNumber: number;
  noOfCycle: number;
  noOfDaysInCycle: number;
  programPlanTypeId: number;
  programPlanType?: string;
  isOnline: boolean;
  isVisibleOnWeb: boolean;
  programPlanFees: { fees: number; currencyCode: string }[];
  imagePath: any[];
}

/**
 * Service to manage program plan data
 * Loads program plans from the public API
 */
@Injectable({
  providedIn: 'root'
})
export class ProgramPlanService {
  private readonly httpService = inject(HttpService);

  /**
   * Get all program plans visible on web
   */
  async getAllProgramPlans(): Promise<ProgramPlan[]> {
    try {
      const data = await this.httpService.get<IPublicTableList<ProgramPlan>>(
        'public/program-plan/list',
        {
          page: '0',
          limit: '1000'
        }
      );
      if (data) {
        return data.tableData || [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching program plans:', error);
      return [];
    }
  }
}

