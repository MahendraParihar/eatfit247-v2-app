import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import {
  AbilitiesGuard,
  CurrentUser,
  JwtAuthGuard,
  RequestedIp,
  RequireAbility,
  UpdateActiveDto,
} from '@server_1/core';
import { AdminActionEnum, AdminSubjectEnum, IAuthUser, IExchangeRate } from '@eatfit247-shared-lib';
import { ExchangeRateService } from '../../services/exchange-rate.service';
import { ManageExchangeRateDto } from '../../dto/exchange-rate.dto';

/** Exchange rates (roadmap 4.6, group 9): official fetched rates plus Finance entries. */
@Controller('exchange-rates')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class ExchangeRateController {
  constructor(private readonly service: ExchangeRateService) {}

  @Get()
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.ExchangeRate)
  async list(
    @Query('fromCurrency') fromCurrency?: string,
    @Query('toCurrency') toCurrency?: string,
    @Query('limit') limit?: number,
  ): Promise<IExchangeRate[]> {
    return this.service.list({ fromCurrency, toCurrency, limit });
  }

  @Post()
  @RequireAbility(AdminActionEnum.Create, AdminSubjectEnum.ExchangeRate)
  async create(
    @Body() body: ManageExchangeRateDto,
    @CurrentUser() user: IAuthUser,
    @RequestedIp() ip: string,
  ): Promise<IExchangeRate> {
    return this.service.create(body, user, ip);
  }

  @Patch(':id/status')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.ExchangeRate)
  async changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateActiveDto,
    @CurrentUser() user: IAuthUser,
    @RequestedIp() ip: string,
  ): Promise<void> {
    await this.service.changeStatus(id, body.active, user, ip);
  }
}
