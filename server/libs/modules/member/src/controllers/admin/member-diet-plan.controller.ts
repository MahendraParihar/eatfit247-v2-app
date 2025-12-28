import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@server/common';

@Controller('member/:id/diet-plan')
@UseGuards(JwtAuthGuard)
export class MemberDietPlanController {
  constructor() {}

  @Get()
  async getDietPlan(@Param('id') id: number): Promise<any> {
    // TODO: Implement diet plan service and endpoints
    return null;
  }
}
