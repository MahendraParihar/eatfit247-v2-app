import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import {
  AbilitiesGuard,
  CurrentUser,
  JwtAuthGuard,
  RequestedIp,
  RequireAbility,
  UpdateIsSolvedDto,
} from '@server_1/core';
import { MemberIssueResponseService, MemberIssueService } from '../../services';
import {
  AdminActionEnum,
  AdminSubjectEnum,
  IAuthUser,
  IIssueMasterData,
  IMemberIssue,
  IMemberIssueResponse,
  ITableList,
} from '@eatfit247-shared-lib';
import { CreateMemberIssueDto, CreateMemberIssueResponseDto, MemberIssueReportDto } from '../../dto';

@Controller('member')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class MemberIssueController {
  constructor(
    private readonly memberIssueService: MemberIssueService,
    private readonly memberIssueResponseService: MemberIssueResponseService,
  ) {}

  @Get('issues-master')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.MemberIssues)
  async getIssuesMasterData(): Promise<IIssueMasterData> {
    return await this.memberIssueService.getIssuesMasterData();
  }

  @Post('issues-report')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.MemberIssues)
  async getMemberIssuesReport(@Body() dto: MemberIssueReportDto): Promise<ITableList<any>> {
    return await this.memberIssueService.getMemberIssuesReport(dto);
  }

  @Get(':id/issues')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.MemberIssues)
  async getMemberIssuesList(@Param('id') id: number): Promise<IMemberIssue[]> {
    return await this.memberIssueService.findByMemberId(id);
  }

  @Post(':id/issues')
  @RequireAbility(AdminActionEnum.Create, AdminSubjectEnum.MemberIssues)
  async createIssue(
    @Param('id') id: number,
    @Body() body: CreateMemberIssueDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<IMemberIssue> {
    body.memberId = id;
    return await this.memberIssueService.create(
      body,
      requestedIp,
      currentUser.adminId,
    );
  }

  @Put(':id/issues/:issueId')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.MemberIssues)
  async updateIssue(
    @Param('id') id: number,
    @Param('issueId') issueId: number,
    @Body() body: CreateMemberIssueDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<IMemberIssue> {
    body.memberId = id;
    return await this.memberIssueService.update(
      issueId,
      body,
      requestedIp,
      currentUser.adminId,
    );
  }

  @Get(':id/issues/:issueId/responses')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.MemberIssues)
  async getIssueResponses(
    @Param('id') id: number,
    @Param('issueId') issueId: number,
  ): Promise<IMemberIssueResponse[]> {
    return await this.memberIssueResponseService.findByMemberIssueId(issueId);
  }

  @Post(':id/issues/:issueId/responses')
  @RequireAbility(AdminActionEnum.Create, AdminSubjectEnum.MemberIssues)
  async createIssueResponse(
    @Param('id') id: number,
    @Param('issueId') issueId: number,
    @Body() body: CreateMemberIssueResponseDto,
    @CurrentUser() currentUser: IAuthUser,
  ): Promise<IMemberIssueResponse> {
    return await this.memberIssueResponseService.create(
      issueId,
      body.response,
      currentUser.adminId,
    );
  }

  @Post(':id/issues/:issueId/mark-solved')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.MemberIssues)
  async markIssueAsSolved(
    @Param('id') id: number,
    @Param('issueId') issueId: number,
    @Body() body: UpdateIsSolvedDto,
    @CurrentUser() currentUser: IAuthUser,
  ): Promise<IMemberIssue> {
    return await this.memberIssueResponseService.markAsSolved(
      issueId,
      body.isSolved,
      currentUser.adminId,
    );
  }
}
