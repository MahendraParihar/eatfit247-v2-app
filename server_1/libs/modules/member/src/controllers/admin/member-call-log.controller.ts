import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, RequestedIp } from '@server_1/core';
import { BasicSearchDto } from '@server_1/shared-dto';
import { MemberCallLogsService } from '../../services';
import {
  ICallLogMasterData,
  IMemberCallLog,
  ICallLogSlot,
  ITableList,
} from '@eatfit247-shared-lib';
import {
  AvailableSlotDto,
  StatusChangeCallLogDto,
  CreateMemberCallLogDto,
} from '../../dto';

/**
 * Consolidated controller for all call log operations:
 * - Global call log listing (admin view)
 * - Member-specific call log operations
 */
@Controller()
@UseGuards(JwtAuthGuard)
export class MemberCallLogController {
  constructor(private readonly memberCallLogsService: MemberCallLogsService) {}

  // ==================== GLOBAL CALL LOG ENDPOINTS ====================
  // Route: call-log/list

  @Get('call-log/list')
  async list(@Query() req: BasicSearchDto & { search?: string }): Promise<ITableList<IMemberCallLog>> {
    return await this.memberCallLogsService.findAll(req);
  }

  // ==================== MEMBER-SPECIFIC CALL LOG ENDPOINTS ====================
  // Route: member/:id/call-logs

  @Get('member/:id/call-logs')
  async getCallLogs(@Param('id') id: number): Promise<IMemberCallLog[]> {
    return await this.memberCallLogsService.findByMemberId(id);
  }

  @Get('member/:id/call-logs/master-data')
  async getMasterData(): Promise<ICallLogMasterData> {
    return await this.memberCallLogsService.getMasterData();
  }

  @Post('member/:id/call-logs/available-timeslot')
  async getTimeslots(@Body() body: AvailableSlotDto): Promise<ICallLogSlot[]> {
    return this.memberCallLogsService.getTimeslots(body);
  }

  @Post('member/:id/call-logs')
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

  @Post('member/:id/call-logs/cancel')
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

  @Post('member/:id/call-logs/complete')
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

