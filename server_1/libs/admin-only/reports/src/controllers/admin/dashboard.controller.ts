import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AbilitiesGuard, JwtAuthGuard, RequireAbility } from '@server_1/core';
import {
  AdminActionEnum,
  AdminSubjectEnum,
  IDashboardKpis,
  IEngagementData,
  IMemberGrowthData,
  IOperationsSnapshot,
  IProgramPerformanceData,
  IRevenueData,
} from '@eatfit247-shared-lib';
import { DashboardService } from '../../services';

@Controller('reports/dashboard')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('kpis')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Dashboard)
  async getKpis(): Promise<IDashboardKpis> {
    return await this.dashboardService.getKpis();
  }

  @Get('revenue')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Dashboard)
  async getRevenueData(): Promise<IRevenueData> {
    return await this.dashboardService.getRevenueData();
  }

  @Get('members')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Dashboard)
  async getMemberGrowthData(
    @Query('period') period: 'weekly' | 'monthly' = 'monthly',
  ): Promise<IMemberGrowthData> {
    return await this.dashboardService.getMemberGrowthData(period);
  }

  @Get('programs')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Dashboard)
  async getProgramPerformanceData(): Promise<IProgramPerformanceData[]> {
    return await this.dashboardService.getProgramPerformanceData();
  }

  @Get('tasks')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Dashboard)
  async getOperationsSnapshot(): Promise<IOperationsSnapshot> {
    return await this.dashboardService.getOperationsSnapshot();
  }

  @Get('engagement')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Dashboard)
  async getEngagementData(): Promise<IEngagementData> {
    return await this.dashboardService.getEngagementData();
  }
}
