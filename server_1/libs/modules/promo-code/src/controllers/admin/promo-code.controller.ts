import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, RequestedIp } from '@server_1/core';
import { BasicSearchDto } from '@server_1/shared-dto';
import { PromoCodeService } from '../../services';
import { CreatePromoCodeDto, ApplyPromoCodeDto } from '../../dto';
import { ITableList, IResponse } from '@eatfit247-shared-lib';

@Controller('promo-code')
@UseGuards(JwtAuthGuard)
export class PromoCodeController {
  constructor(private readonly service: PromoCodeService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<any>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  async getById(@Param('id') id: number): Promise<any> {
    return await this.service.fetchById(id);
  }

  @Post('manage')
  async create(
    @Body() body: CreatePromoCodeDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.create(body, requestedIp, currentUser.userId || currentUser.adminId);
  }

  @Put('manage/:id')
  async update(
    @Param('id') id: number,
    @Body() body: CreatePromoCodeDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.update(id, body, requestedIp, currentUser.userId || currentUser.adminId);
  }

  @Patch('update-status/:id')
  async changeStatus(
    @Param('id') id: number,
    @Body() body: { active: boolean },
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.changeStatus(id, body.active, requestedIp, currentUser.userId || currentUser.adminId);
  }

  @Post('apply')
  async applyPromoCode(@Body() body: ApplyPromoCodeDto): Promise<any> {
    return await this.service.applyPromoCode(body);
  }
}

