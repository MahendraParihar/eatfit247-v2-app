import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, RequestedIp } from '@server_1/core';
import { MemberIssueService, MemberIssueResponseService } from '../../services';
import {
  IMemberIssue,
  IMemberIssueResponse,
  IIssueMasterData,
} from '@eatfit247-shared-lib';
import { CreateMemberIssueDto, CreateMemberIssueResponseDto } from '../../dto';

@Controller('member')
@UseGuards(JwtAuthGuard)
export class MemberIssueController {
  constructor(
    private readonly memberIssueService: MemberIssueService,
    private readonly memberIssueResponseService: MemberIssueResponseService,
  ) {}

  @Get('issues-master')
  async getIssuesMasterData(): Promise<IIssueMasterData> {
    return await this.memberIssueService.getIssuesMasterData();
  }

  @Get(':id/issues')
  async getMemberIssuesList(@Param('id') id: number): Promise<IMemberIssue[]> {
    return await this.memberIssueService.findByMemberId(id);
  }

  @Post(':id/issues')
  async createIssue(
    @Param('id') id: number,
    @Body() body: CreateMemberIssueDto,
    @CurrentUser() currentUser: any,
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
  async updateIssue(
    @Param('id') id: number,
    @Param('issueId') issueId: number,
    @Body() body: CreateMemberIssueDto,
    @CurrentUser() currentUser: any,
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
  async getIssueResponses(
    @Param('id') id: number,
    @Param('issueId') issueId: number,
  ): Promise<IMemberIssueResponse[]> {
    return await this.memberIssueResponseService.findByMemberIssueId(issueId);
  }

  @Post(':id/issues/:issueId/responses')
  async createIssueResponse(
    @Param('id') id: number,
    @Param('issueId') issueId: number,
    @Body() body: CreateMemberIssueResponseDto,
    @CurrentUser() currentUser: any,
  ): Promise<IMemberIssueResponse> {
    return await this.memberIssueResponseService.create(
      issueId,
      body.response,
      currentUser.adminId,
    );
  }

  @Post(':id/issues/:issueId/mark-solved')
  async markIssueAsSolved(
    @Param('id') id: number,
    @Param('issueId') issueId: number,
    @Body() body: { isSolved: boolean },
    @CurrentUser() currentUser: any,
  ): Promise<IMemberIssue> {
    return await this.memberIssueResponseService.markAsSolved(
      issueId,
      body.isSolved,
      currentUser.adminId,
    );
  }
}
