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
import { CreateTaxMasterDto, TaxRulePreviewDto } from '../../dto/tax-master.dto';
import {
  AdminActionEnum,
  AdminSubjectEnum,
  IAuthUser,
  ITableList,
  ITaxMaster,
  ITaxRulePreviewResponse,
  ITaxRuleSaveResult,
} from '@eatfit247-shared-lib';

@Controller('tax-master')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class TaxMasterController {
  constructor(private readonly service: TaxMasterService) {}

  @Get('list')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.TaxMaster)
  async list(@Query() req: BasicSearchDto, @CurrentUser() currentUser: IAuthUser): Promise<ITableList<ITaxMaster>> {
    return await this.service.findAll(req, currentUser);
  }

  @Get('manage/:id')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.TaxMaster)
  async getById(@Param('id') id: number, @CurrentUser() currentUser: IAuthUser): Promise<ITaxMaster> {
    return await this.service.fetchById(id, currentUser);
  }

  /** Which rule would price a sale (decision 7): winner, runners-up, warnings. Saves nothing; franchise-scoped. */
  @Post('preview')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.TaxMaster)
  async preview(@Body() body: TaxRulePreviewDto, @CurrentUser() currentUser: IAuthUser): Promise<ITaxRulePreviewResponse> {
    return await this.service.preview(body, currentUser);
  }

  @Post('manage')
  @RequireAbility(AdminActionEnum.Create, AdminSubjectEnum.TaxMaster)
  async create(
    @Body() body: CreateTaxMasterDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<ITaxRuleSaveResult> {
    return await this.service.create(body, requestedIp, currentUser);
  }

  @Put('manage/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.TaxMaster)
  async update(
    @Param('id') id: number,
    @Body() body: CreateTaxMasterDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<ITaxRuleSaveResult> {
    return await this.service.update(id, body, requestedIp, currentUser);
  }

  @Patch('update-status/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.TaxMaster)
  async changeStatus(
    @Param('id') id: number,
    @Body() body: UpdateActiveDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.changeStatus(id, body.active, requestedIp, currentUser);
  }
}

