import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@server_1/core';
import {
  DashboardKpis,
  DashboardService,
  EngagementData,
  MemberGrowthData,
  OperationsSnapshot,
  ProgramPerformanceData,
  RevenueData,
} from '../../services';

@Controller('reports/dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('kpis')
  async getKpis(): Promise<DashboardKpis> {
    return await this.dashboardService.getKpis();
  }

  @Get('revenue')
  async getRevenueData(): Promise<RevenueData> {
    return await this.dashboardService.getRevenueData();
  }

  @Get('members')
  async getMemberGrowthData(
    @Query('period') period: 'weekly' | 'monthly' = 'monthly',
  ): Promise<MemberGrowthData> {
    return await this.dashboardService.getMemberGrowthData(period);
  }

  @Get('programs')
  async getProgramPerformanceData(): Promise<ProgramPerformanceData[]> {
    return await this.dashboardService.getProgramPerformanceData();
  }

  @Get('tasks')
  async getOperationsSnapshot(): Promise<OperationsSnapshot> {
    return await this.dashboardService.getOperationsSnapshot();
  }

  @Get('engagement')
  async getEngagementData(): Promise<EngagementData> {
    return await this.dashboardService.getEngagementData();
  }
}
