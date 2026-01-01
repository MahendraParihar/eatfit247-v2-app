import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@server_1/core';

@Controller('member/:id/dashboard')
@UseGuards(JwtAuthGuard)
export class MemberDashboardController {
  constructor() {}

  @Get()
  async getDashboard(@Param('id') id: number): Promise<any> {
    // TODO: Implement dashboard service and endpoints
    return {};
  }
}
