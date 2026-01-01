import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, RequestedIp } from '@server_1/core';
import { MemberCallLogsService } from '../../services';
import { ICallLogMasterData, IMemberCallLog, ICallLogSlot } from '@eatfit247-shared-lib';
import {
  AvailableSlotDto,
  StatusChangeCallLogDto,
  CreateMemberCallLogDto,
} from '../../dto';

@Controller('member/:id/call-logs')
@UseGuards(JwtAuthGuard)
export class MemberCallLogsController {
  constructor(private readonly memberCallLogsService: MemberCallLogsService) {}

  @Get()
  async getCallLogs(@Param('id') id: number): Promise<IMemberCallLog[]> {
    return await this.memberCallLogsService.findByMemberId(id);
  }

  @Get('master-data')
  async getMasterData(): Promise<ICallLogMasterData> {
    return await this.memberCallLogsService.getMasterData();
  }

  @Post('available-timeslot')
  async getTimeslots(@Body() body: AvailableSlotDto): Promise<ICallLogSlot[]> {
    return this.memberCallLogsService.getTimeslots(body);
  }

  @Post()
  async create(
    @Param('id') id: number,
    @Body() body: CreateMemberCallLogDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<IMemberCallLog> {
    body.memberId = id;
    return await this.memberCallLogsService.create(
      id,
      body,
      requestedIp,
      currentUser.userId || currentUser.adminId,
    );
  }

  @Post('cancel')
  async cancel(
    @Body() body: StatusChangeCallLogDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.memberCallLogsService.cancel(
      body,
      requestedIp,
      currentUser.userId || currentUser.adminId,
    );
  }

  @Post('complete')
  async complete(
    @Body() body: StatusChangeCallLogDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.memberCallLogsService.complete(
      body,
      requestedIp,
      currentUser.userId || currentUser.adminId,
    );
  }
}
