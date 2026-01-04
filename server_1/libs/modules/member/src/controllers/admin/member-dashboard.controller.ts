import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@server_1/core';
import { MemberDashboardService } from '../../services';

@Controller('member/:id')
@UseGuards(JwtAuthGuard)
export class MemberDashboardController {
  constructor(private readonly memberDashboardService: MemberDashboardService) {}

  @Get('dashboard/summary')
  async getDashboardSummary(@Param('id') id: number): Promise<any> {
    return await this.memberDashboardService.getDashboardSummary(id);
  }

  @Get('health-progress')
  async getHealthProgress(@Param('id') id: number): Promise<any> {
    return await this.memberDashboardService.getHealthProgress(id);
  }

  @Get('engagement')
  async getEngagement(@Param('id') id: number): Promise<any> {
    return await this.memberDashboardService.getEngagement(id);
  }

  @Get('payments/summary')
  async getPaymentsSummary(@Param('id') id: number): Promise<any> {
    return await this.memberDashboardService.getPaymentsSummary(id);
  }

  @Get('issues/summary')
  async getIssuesSummary(@Param('id') id: number): Promise<any> {
    return await this.memberDashboardService.getIssuesSummary(id);
  }
}
