import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
  AbilitiesGuard,
  BasicSearchDto,
  CurrentUser,
  JwtAuthGuard,
  RequestedIp,
  RequireAbility,
} from '@server_1/core';
import { MemberCallLogsService } from '../../services';
import {
  AdminActionEnum,
  AdminSubjectEnum,
  IAuthUser,
  ICallLogMasterData,
  ICallLogSlot,
  IMemberCallLog,
  ITableList,
} from '@eatfit247-shared-lib';
import { AvailableSlotDto, CreateMemberCallLogDto, StatusChangeCallLogDto } from '../../dto';

/**
 * Consolidated controller for all call log operations:
 * - Global call log listing (admin view)
 * - Member-specific call log operations
 */
@Controller()
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class MemberCallLogController {
  constructor(private readonly memberCallLogsService: MemberCallLogsService) {}

  // ==================== GLOBAL CALL LOG ENDPOINTS ====================
  // Route: call-log/list

  @Get('call-log/list')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.MemberCallLogs)
  async list(@Query() req: BasicSearchDto & { search?: string }): Promise<ITableList<IMemberCallLog>> {
    return await this.memberCallLogsService.findAll(req);
  }

  // ==================== MEMBER-SPECIFIC CALL LOG ENDPOINTS ====================
  // Route: member/:id/call-logs

  @Get('member/:id/call-logs')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.MemberCallLogs)
  async getCallLogs(@Param('id') id: number): Promise<IMemberCallLog[]> {
    return await this.memberCallLogsService.findByMemberId(id);
  }

  @Get('member/:id/call-logs/master-data')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.MemberCallLogs)
  async getMasterData(): Promise<ICallLogMasterData> {
    return await this.memberCallLogsService.getMasterData();
  }

  @Post('member/:id/call-logs/available-timeslot')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.MemberCallLogs)
  async getTimeslots(@Body() body: AvailableSlotDto): Promise<ICallLogSlot[]> {
    return this.memberCallLogsService.getTimeslots(body);
  }

  @Post('member/:id/call-logs')
  @RequireAbility(AdminActionEnum.Create, AdminSubjectEnum.MemberCallLogs)
  async create(
    @Param('id') id: number,
    @Body() body: CreateMemberCallLogDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<IMemberCallLog> {
    body.memberId = id;
    return await this.memberCallLogsService.create(
      id,
      body,
      requestedIp,
      currentUser.adminId,
    );
  }

  @Post('member/:id/call-logs/cancel')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.MemberCallLogs)
  async cancel(
    @Body() body: StatusChangeCallLogDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.memberCallLogsService.cancel(
      body,
      requestedIp,
      currentUser.adminId,
    );
  }

  @Post('member/:id/call-logs/complete')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.MemberCallLogs)
  async complete(
    @Body() body: StatusChangeCallLogDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.memberCallLogsService.complete(
      body,
      requestedIp,
      currentUser.adminId,
    );
  }
}

