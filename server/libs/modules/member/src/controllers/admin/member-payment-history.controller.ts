import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@server/common';

@Controller('member/:id/payment-history')
@UseGuards(JwtAuthGuard)
export class MemberPaymentHistoryController {
  constructor() {}

  @Get()
  async getPaymentHistory(@Param('id') id: number): Promise<any> {
    // TODO: Implement payment history service and endpoints
    return [];
  }
}
