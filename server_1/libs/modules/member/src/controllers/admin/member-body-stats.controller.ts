import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard, RequestedIp } from '@server_1/core';
import { MemberHealthParameterLogsService } from '../../services';
import { IAuthUser, IHealthParameterMaster, IMemberHealthParameterLog } from '@eatfit247-shared-lib';
import { CreateMemberHealthParameterLogDto } from '../../dto';

@Controller('member/:id/health-parameter-logs')
@UseGuards(JwtAuthGuard)
export class MemberBodyStatsController {
  constructor(
    private readonly memberHealthParameterLogsService: MemberHealthParameterLogsService,
  ) {}

  @Get()
  async getHealthParameterLogs(@Param('id') id: number): Promise<IMemberHealthParameterLog[]> {
    return await this.memberHealthParameterLogsService.findByMemberId(id);
  }

  @Get('master-data')
  async getMasterData(): Promise<IHealthParameterMaster> {
    return await this.memberHealthParameterLogsService.getMasterData();
  }

  @Post()
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
  async getById(
    @Param('id') id: number,
    @Param('logId') logId: number,
  ): Promise<IMemberHealthParameterLog> {
    return await this.memberHealthParameterLogsService.findById(id, logId);
  }

  @Delete(':logId')
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
