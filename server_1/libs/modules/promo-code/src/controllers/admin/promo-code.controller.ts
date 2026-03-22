import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import {
  AbilitiesGuard,
  BasicSearchDto,
  CurrentUser,
  JwtAuthGuard,
  RequestedIp,
  RequireAbility,
  UpdateActiveDto,
} from '@server_1/core';
import { PromoCodeService } from '../../services';
import { ApplyPromoCodeDto, CreatePromoCodeDto } from '../../dto';
import { AdminActionEnum, AdminSubjectEnum, IAuthUser, ITableList } from '@eatfit247-shared-lib';

@Controller('promo-code')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class PromoCodeController {
  constructor(private readonly service: PromoCodeService) {}

  @Get('list')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.PromoCode)
  async list(@Query() req: BasicSearchDto): Promise<ITableList<any>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.PromoCode)
  async getById(@Param('id') id: number): Promise<any> {
    return await this.service.fetchById(id);
  }

  @Post('manage')
  @RequireAbility(AdminActionEnum.Create, AdminSubjectEnum.PromoCode)
  async create(
    @Body() body: CreatePromoCodeDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.create(body, requestedIp, currentUser.adminId);
  }

  @Put('manage/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.PromoCode)
  async update(
    @Param('id') id: number,
    @Body() body: CreatePromoCodeDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.update(id, body, requestedIp, currentUser.adminId);
  }

  @Patch('update-status/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.PromoCode)
  async changeStatus(
    @Param('id') id: number,
    @Body() body: UpdateActiveDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.changeStatus(id, body.active, requestedIp, currentUser.adminId);
  }

  @Post('apply')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.PromoCode)
  async applyPromoCode(@Body() body: ApplyPromoCodeDto): Promise<any> {
    return await this.service.applyPromoCode(body);
  }
}

