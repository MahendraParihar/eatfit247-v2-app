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
import { HealthIssueService } from '../../services';
import { CreateHealthIssueDto } from '../../dto';
import {
  AdminActionEnum,
  AdminSubjectEnum,
  IAuthUser,
  IDropdownItem,
  IHealthIssue,
  ITableList,
} from '@eatfit247-shared-lib';

@Controller('health-issue')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class HealthIssueController {
  constructor(private readonly service: HealthIssueService) {}

  @Get('list')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.LovMaster)
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IHealthIssue>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.LovMaster)
  async getById(@Param('id') id: number): Promise<IHealthIssue> {
    return await this.service.fetchById(id);
  }

  @Post('manage')
  @RequireAbility(AdminActionEnum.Create, AdminSubjectEnum.LovMaster)
  async create(
    @Body() body: CreateHealthIssueDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.create(body, requestedIp, currentUser.adminId);
  }

  @Put('manage/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.LovMaster)
  async update(
    @Param('id') id: number,
    @Body() body: CreateHealthIssueDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.update(id, body, requestedIp, currentUser.adminId);
  }

  @Patch('update-status/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.LovMaster)
  async changeStatus(
    @Param('id') id: number,
    @Body() body: UpdateActiveDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.changeStatus(id, body.active, requestedIp, currentUser.adminId);
  }

  @Get('dropdown')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.LovMaster)
  async getDropdownList(): Promise<IDropdownItem[]> {
    return await this.service.getHealthIssueList();
  }
}

