import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import {
  AbilitiesGuard,
  CurrentUser,
  JwtAuthGuard,
  RequestedIp,
  RequireAbility,
  UpdateHealthIssueIdsDto,
} from '@server_1/core';
import { MemberAssessmentService, MemberHealthIssueService, MemberHealthParameterLogsService } from '../../services';
import {
  AdminActionEnum,
  AdminSubjectEnum,
  IAuthUser,
  IHealthParameterMaster,
  IMemberAssessment,
  IMemberHealthIssue,
  IMemberHealthParameterLog,
  ITableList,
} from '@eatfit247-shared-lib';
import { CreateMemberAssessmentDto, CreateMemberHealthParameterLogDto } from '../../dto';

/**
 * Consolidated controller for all member health-related operations:
 * - Assessment management
 * - Health issues management
 * - Health parameter logs (body stats)
 */
@Controller('member/:id')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class MemberHealthController {
  constructor(
    private readonly memberAssessmentService: MemberAssessmentService,
    private readonly memberHealthIssueService: MemberHealthIssueService,
    private readonly memberHealthParameterLogsService: MemberHealthParameterLogsService,
  ) {}

  // ==================== ASSESSMENT ENDPOINTS ====================
  // Route: member/:id/assessment

  @Get('assessment')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.MemberAssessment)
  async getAssessment(@Param('id') id: number): Promise<IMemberAssessment | null> {
    return await this.memberAssessmentService.findByMemberId(id);
  }

  @Put('assessment')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.MemberAssessment)
  async updateAssessment(
    @Param('id') id: number,
    @Body() body: CreateMemberAssessmentDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.memberAssessmentService.createOrUpdate(
      id,
      body,
      requestedIp,
      currentUser.adminId,
    );
  }

  // ==================== HEALTH ISSUES ENDPOINTS ====================
  // Route: member/:id/health-issues

  @Get('health-issues')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.MemberHealth)
  async getHealthIssues(@Param('id') id: number): Promise<ITableList<IMemberHealthIssue>> {
    return await this.memberHealthIssueService.getList(id, true);
  }

  @Get('health-issues/list')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.MemberHealth)
  async getHealthIssueList(@Param('id') id: number): Promise<ITableList<IMemberHealthIssue>> {
    return await this.memberHealthIssueService.getList(id, false);
  }

  @Put('health-issues/manage')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.MemberHealth)
  async manageHealthIssues(
    @Param('id') id: number,
    @Body() body: UpdateHealthIssueIdsDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.memberHealthIssueService.manage(
      id,
      body.healthIssueIds,
      requestedIp,
      currentUser.adminId,
    );
  }

  // ==================== HEALTH PARAMETER LOGS (BODY STATS) ENDPOINTS ====================
  // Route: member/:id/health-parameter-logs

  @Get('health-parameter-logs')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.MemberHealth)
  async getHealthParameterLogs(@Param('id') id: number): Promise<IMemberHealthParameterLog[]> {
    return await this.memberHealthParameterLogsService.findByMemberId(id);
  }

  @Get('health-parameter-logs/master-data')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.MemberHealth)
  async getHealthParameterLogsMasterData(): Promise<IHealthParameterMaster> {
    return await this.memberHealthParameterLogsService.getMasterData();
  }

  @Post('health-parameter-logs')
  @RequireAbility(AdminActionEnum.Create, AdminSubjectEnum.MemberHealth)
  async createHealthParameterLog(
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

  @Put('health-parameter-logs/:logId')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.MemberHealth)
  async updateHealthParameterLog(
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

  @Get('health-parameter-logs/:logId')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.MemberHealth)
  async getHealthParameterLogById(
    @Param('id') id: number,
    @Param('logId') logId: number,
  ): Promise<IMemberHealthParameterLog> {
    return await this.memberHealthParameterLogsService.findById(id, logId);
  }

  @Delete('health-parameter-logs/:logId')
  @RequireAbility(AdminActionEnum.Delete, AdminSubjectEnum.MemberHealth)
  async deleteHealthParameterLog(
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

