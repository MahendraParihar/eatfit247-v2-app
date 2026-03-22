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
import { CurrencyService } from '@server_1/platform';
import { ProgramPlanService } from '../../services';
import { CreateProgramPlanDto } from '../../dto';
import {
  AdminActionEnum,
  AdminSubjectEnum,
  IAuthUser,
  IDropdownItem,
  IProgramPlan,
  ITableList,
} from '@eatfit247-shared-lib';

@Controller('program-plan')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class ProgramPlanController {
  constructor(
    private readonly service: ProgramPlanService,
    private readonly currencyService: CurrencyService,
  ) {}

  @Get('list')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.ProgramPlan)
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IProgramPlan>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.ProgramPlan)
  async getById(@Param('id') id: number): Promise<IProgramPlan> {
    return await this.service.fetchById(id);
  }

  @Post('manage')
  @RequireAbility(AdminActionEnum.Create, AdminSubjectEnum.ProgramPlan)
  async create(
    @Body() body: CreateProgramPlanDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.create(body, requestedIp, currentUser.adminId);
  }

  @Put('manage/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.ProgramPlan)
  async update(
    @Param('id') id: number,
    @Body() body: CreateProgramPlanDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.update(id, body, requestedIp, currentUser.adminId);
  }

  @Patch('update-status/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.ProgramPlan)
  async changeStatus(
    @Param('id') id: number,
    @Body() body: UpdateActiveDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.changeStatus(id, body.active, requestedIp, currentUser.adminId);
  }

  @Get('program-plan-master')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.ProgramPlan)
  async programPlanMasterData(): Promise<{
    programPlanType: IDropdownItem[];
    currencies: IDropdownItem[];
  }> {
    const [types, currencies] = await Promise.all([
      this.service.getProgramPlanTypeList(),
      await this.currencyService.getAllCurrencies(),
    ]);
    return {
      programPlanType: types,
      currencies: currencies.map((s: any) => {
        return { id: s.currencyCode, label: s.label };
      }),
    };
  }
}

