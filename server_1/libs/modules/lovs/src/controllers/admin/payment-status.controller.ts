import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@server_1/core';
import { PaymentStatusService } from '@server_1/platform';
import { IDropdownItem } from '@eatfit247-shared-lib';

@Controller('lov/payment-status')
@UseGuards(JwtAuthGuard)
export class PaymentStatusController {
  constructor(private readonly service: PaymentStatusService) {}

  @Get('dropdown')
  async getDropdownList(): Promise<IDropdownItem[]> {
    return await this.service.getDropdownList();
  }
}

