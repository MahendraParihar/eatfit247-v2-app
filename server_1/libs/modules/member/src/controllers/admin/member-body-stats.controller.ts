import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AbilitiesGuard, CurrentUser, JwtAuthGuard, RequestedIp, RequireAbility } from '@server_1/core';
import { MemberHealthParameterLogsService } from '../../services';
import {
  AdminActionEnum,
  AdminSubjectEnum,
  IAuthUser,
  IHealthParameterMaster,
  IMemberHealthParameterLog,
} from '@eatfit247-shared-lib';
import { CreateMemberHealthParameterLogDto } from '../../dto';

@Controller('member/:id/health-parameter-logs')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class MemberBodyStatsController {
  constructor(
    private readonly memberHealthParameterLogsService: MemberHealthParameterLogsService,
  ) {}

  @Get()
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.MemberHealth)
  async getHealthParameterLogs(@Param('id') id: number): Promise<IMemberHealthParameterLog[]> {
    return await this.memberHealthParameterLogsService.findByMemberId(id);
  }

  @Get('master-data')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.MemberHealth)
  async getMasterData(): Promise<IHealthParameterMaster> {
    return await this.memberHealthParameterLogsService.getMasterData();
  }

  @Post()
  @RequireAbility(AdminActionEnum.Create, AdminSubjectEnum.MemberHealth)
  async create(
    @Param('id') id: number,
    @Body() body: CreateMemberHealthParameterLogDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<IMemberHealthParameterLog> {
    body.memberId = id;
    return await this.memberHealthParameterLogsService.createOrUpdate(
      id,
      body,
      requestedIp,
      currentUser.adminId,
    );
  }

  @Put(':logId')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.MemberHealth)
  async update(
    @Param('id') id: number,
    @Param('logId') logId: number,
    @Body() body: CreateMemberHealthParameterLogDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<IMemberHealthParameterLog> {
    body.memberId = id;
    body.memberHealthParameterLogId = logId;
    return await this.memberHealthParameterLogsService.createOrUpdate(
      id,
      body,
      requestedIp,
      currentUser.adminId,
    );
  }

  @Get(':logId')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.MemberHealth)
  async getById(
    @Param('id') id: number,
    @Param('logId') logId: number,
  ): Promise<IMemberHealthParameterLog> {
    return await this.memberHealthParameterLogsService.findById(id, logId);
  }

  @Delete(':logId')
  @RequireAbility(AdminActionEnum.Delete, AdminSubjectEnum.MemberHealth)
  async delete(
    @Param('id') id: number,
    @Param('logId') logId: number,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.memberHealthParameterLogsService.delete(
      id,
      logId,
      requestedIp,
      currentUser.adminId,
    );
  }
}
