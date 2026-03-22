import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AbilitiesGuard, JwtAuthGuard, RequireAbility } from '@server_1/core';
import { MemberDashboardService } from '../../services';
import { AdminActionEnum, AdminSubjectEnum } from '@eatfit247-shared-lib';

@Controller('member/:id')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class MemberDashboardController {
  constructor(private readonly memberDashboardService: MemberDashboardService) {}

  @Get('dashboard/summary')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Member)
  async getDashboardSummary(@Param('id') id: number): Promise<any> {
    return await this.memberDashboardService.getDashboardSummary(id);
  }

  @Get('health-progress')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Member)
  async getHealthProgress(@Param('id') id: number): Promise<any> {
    return await this.memberDashboardService.getHealthProgress(id);
  }

  @Get('engagement')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Member)
  async getEngagement(@Param('id') id: number): Promise<any> {
    return await this.memberDashboardService.getEngagement(id);
  }

  @Get('payments/summary')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Member)
  async getPaymentsSummary(@Param('id') id: number): Promise<any> {
    return await this.memberDashboardService.getPaymentsSummary(id);
  }

  @Get('issues/summary')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Member)
  async getIssuesSummary(@Param('id') id: number): Promise<any> {
    return await this.memberDashboardService.getIssuesSummary(id);
  }
}
