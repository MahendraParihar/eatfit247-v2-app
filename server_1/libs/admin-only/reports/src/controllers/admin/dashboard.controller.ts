import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@server_1/core';
import {
  IDashboardKpis,
  IEngagementData,
  IMemberGrowthData,
  IOperationsSnapshot,
  IProgramPerformanceData,
  IRevenueData,
} from '@eatfit247-shared-lib';
import { DashboardService } from '../../services';

@Controller('reports/dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('kpis')
  async getKpis(): Promise<IDashboardKpis> {
    return await this.dashboardService.getKpis();
  }

  @Get('revenue')
  async getRevenueData(): Promise<IRevenueData> {
    return await this.dashboardService.getRevenueData();
  }

  @Get('members')
  async getMemberGrowthData(
    @Query('period') period: 'weekly' | 'monthly' = 'monthly',
  ): Promise<IMemberGrowthData> {
    return await this.dashboardService.getMemberGrowthData(period);
  }

  @Get('programs')
  async getProgramPerformanceData(): Promise<IProgramPerformanceData[]> {
    return await this.dashboardService.getProgramPerformanceData();
  }

  @Get('tasks')
  async getOperationsSnapshot(): Promise<IOperationsSnapshot> {
    return await this.dashboardService.getOperationsSnapshot();
  }

  @Get('engagement')
  async getEngagementData(): Promise<IEngagementData> {
    return await this.dashboardService.getEngagementData();
  }
}
