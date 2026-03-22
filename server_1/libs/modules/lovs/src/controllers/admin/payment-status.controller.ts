import { Controller, Get, UseGuards } from '@nestjs/common';
import { AbilitiesGuard, JwtAuthGuard, RequireAbility } from '@server_1/core';
import { PaymentStatusService } from '@server_1/platform';
import { AdminActionEnum, AdminSubjectEnum, IDropdownItem } from '@eatfit247-shared-lib';

@Controller('lov/payment-status')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class PaymentStatusController {
  constructor(private readonly service: PaymentStatusService) {}

  @Get('dropdown')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.LovMaster)
  async getDropdownList(): Promise<IDropdownItem[]> {
    return await this.service.getDropdownList();
  }
}

