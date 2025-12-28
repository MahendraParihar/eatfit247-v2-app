import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, RequestedIp } from '@server/common';
import { MemberHealthParameterLogsService } from '../../services';
import {
  IHealthParameterMaster,
  IMemberHealthParameterLog,
} from 'eatfit247-shared-lib';
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
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<IMemberHealthParameterLog> {
    body.memberId = id;
    return await this.memberHealthParameterLogsService.createOrUpdate(
      id,
      body,
      requestedIp,
      currentUser.userId || currentUser.adminId,
    );
  }

  @Put(':logId')
  async update(
    @Param('id') id: number,
    @Param('logId') logId: number,
    @Body() body: CreateMemberHealthParameterLogDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<IMemberHealthParameterLog> {
    body.memberId = id;
    body.memberHealthParameterLogId = logId;
    return await this.memberHealthParameterLogsService.createOrUpdate(
      id,
      body,
      requestedIp,
      currentUser.userId || currentUser.adminId,
    );
  }
}
