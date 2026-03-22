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
import { TaxMasterService } from '../../services/tax-master.service';
import { CreateTaxMasterDto } from '../../dto/tax-master.dto';
import {
  AdminActionEnum,
  AdminSubjectEnum,
  IAuthUser,
  ITableList,
  ITaxMaster,
} from '@eatfit247-shared-lib';

@Controller('tax-master')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class TaxMasterController {
  constructor(private readonly service: TaxMasterService) {}

  @Get('list')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.TaxMaster)
  async list(@Query() req: BasicSearchDto): Promise<ITableList<ITaxMaster>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.TaxMaster)
  async getById(@Param('id') id: number): Promise<ITaxMaster> {
    return await this.service.fetchById(id);
  }

  @Post('manage')
  @RequireAbility(AdminActionEnum.Create, AdminSubjectEnum.TaxMaster)
  async create(
    @Body() body: CreateTaxMasterDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.create(body, requestedIp, currentUser.adminId);
  }

  @Put('manage/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.TaxMaster)
  async update(
    @Param('id') id: number,
    @Body() body: CreateTaxMasterDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.update(id, body, requestedIp, currentUser.adminId);
  }

  @Patch('update-status/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.TaxMaster)
  async changeStatus(
    @Param('id') id: number,
    @Body() body: UpdateActiveDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.changeStatus(id, body.active, requestedIp, currentUser.adminId);
  }
}

