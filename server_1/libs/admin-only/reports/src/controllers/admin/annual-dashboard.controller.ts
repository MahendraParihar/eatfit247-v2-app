import { Controller, Get, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { AbilitiesGuard, CurrentUser, JwtAuthGuard, RequireAbility } from '@server_1/core';
import {
  AdminActionEnum,
  AdminSubjectEnum,
  IAnnualFranchiseContext,
  IAnnualOverview,
  IAnnualTaxBreakdown,
  IAnnualTopPlans,
  IAuthUser,
  TopPlansMode,
} from '@eatfit247-shared-lib';
import { AnnualDashboardService } from '../../services/annual-dashboard.service';

@Controller('reports/annual-dashboard')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class AnnualDashboardController {
  constructor(private readonly annualDashboardService: AnnualDashboardService) {}

  @Get('franchises')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Dashboard)
  async getFranchises(@CurrentUser() user: IAuthUser) {
    return await this.annualDashboardService.getAccessibleFranchises(user);
  }

  @Get('context')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Dashboard)
  async getContext(
    @CurrentUser() user: IAuthUser,
    @Query('franchiseId') franchiseIdRaw?: string,
  ): Promise<IAnnualFranchiseContext> {
    const franchiseId = this.parseOptionalInt(franchiseIdRaw);
    return await this.annualDashboardService.getFranchiseContext(user, franchiseId);
  }

  @Get('overview')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Dashboard)
  async getOverview(
    @CurrentUser() user: IAuthUser,
    @Query('fyStartYear', ParseIntPipe) fyStartYear: number,
    @Query('franchiseId') franchiseIdRaw?: string,
  ): Promise<IAnnualOverview> {
    const franchiseId = this.parseOptionalInt(franchiseIdRaw);
    return await this.annualDashboardService.getAnnualOverview(user, franchiseId, fyStartYear);
  }

  @Get('tax')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Dashboard)
  async getTax(
    @CurrentUser() user: IAuthUser,
    @Query('fyStartYear', ParseIntPipe) fyStartYear: number,
    @Query('franchiseId') franchiseIdRaw?: string,
  ): Promise<IAnnualTaxBreakdown> {
    const franchiseId = this.parseOptionalInt(franchiseIdRaw);
    return await this.annualDashboardService.getAnnualTaxBreakdown(user, franchiseId, fyStartYear);
  }

  @Get('top-plans')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Dashboard)
  async getTopPlans(
    @CurrentUser() user: IAuthUser,
    @Query('fyStartYear', ParseIntPipe) fyStartYear: number,
    @Query('mode') mode: TopPlansMode = 'count',
    @Query('franchiseId') franchiseIdRaw?: string,
  ): Promise<IAnnualTopPlans> {
    const franchiseId = this.parseOptionalInt(franchiseIdRaw);
    const safeMode: TopPlansMode = mode === 'revenue' ? 'revenue' : 'count';
    return await this.annualDashboardService.getTopPerformingPlans(user, franchiseId, fyStartYear, safeMode);
  }

  private parseOptionalInt(raw?: string): number | undefined {
    if (raw === undefined || raw === null || raw === '') return undefined;
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  }
}
