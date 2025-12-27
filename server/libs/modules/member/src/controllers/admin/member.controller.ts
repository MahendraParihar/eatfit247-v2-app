import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, RequestedIp, BasicSearchDto } from '@server/common';
import {
  MemberService,
  MemberPocketGuideService,
  MemberHealthIssueService,
  MemberCallLogsService,
  MemberHealthParameterLogsService,
  MemberIssueService,
} from '../../services';
import { CreateMemberDto } from '../../dto';
import {
  ITableList,
  IMember,
  IResponse,
  IMemberPocketGuide,
  IMemberHealthIssue,
  IMemberCallLog,
  IMemberHealthParameterLog,
  IMemberIssue,
} from 'eatfit247-shared-lib';

@Controller('member')
@UseGuards(JwtAuthGuard)
export class MemberController {
  constructor(
    private readonly service: MemberService,
    private readonly memberPocketGuideService: MemberPocketGuideService,
    private readonly memberHealthIssueService: MemberHealthIssueService,
    private readonly memberCallLogsService: MemberCallLogsService,
    private readonly memberHealthParameterLogsService: MemberHealthParameterLogsService,
    private readonly memberIssueService: MemberIssueService,
  ) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IMember>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  async getById(@Param('id') id: number): Promise<IMember> {
    return await this.service.fetchById(id);
  }

  @Post('manage')
  async create(
    @Body() body: CreateMemberDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.create(body, requestedIp, currentUser.userId || currentUser.adminId);
  }

  @Put('manage/:id')
  async update(
    @Param('id') id: number,
    @Body() body: CreateMemberDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.update(id, body, requestedIp, currentUser.userId || currentUser.adminId);
  }

  @Patch('update-status/:id')
  async changeStatus(
    @Param('id') id: number,
    @Body() body: { active: boolean; deactivationReason?: string },
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.changeStatus(id, body.active, body.deactivationReason || null, requestedIp, currentUser.userId || currentUser.adminId);
  }

  @Get(':id/pocket-guide')
  async getPocketGuides(@Param('id') id: number): Promise<IMemberPocketGuide[]> {
    return await this.memberPocketGuideService.findByMemberId(id);
  }

  @Get(':id/health-issues')
  async getHealthIssues(@Param('id') id: number): Promise<IMemberHealthIssue[]> {
    return await this.memberHealthIssueService.findByMemberId(id);
  }

  @Get(':id/call-logs')
  async getCallLogs(@Param('id') id: number): Promise<IMemberCallLog[]> {
    return await this.memberCallLogsService.findByMemberId(id);
  }

  @Get(':id/health-parameter-logs')
  async getHealthParameterLogs(@Param('id') id: number): Promise<IMemberHealthParameterLog[]> {
    return await this.memberHealthParameterLogsService.findByMemberId(id);
  }

  @Get(':id/issues')
  async getIssues(@Param('id') id: number): Promise<IMemberIssue[]> {
    return await this.memberIssueService.findByMemberId(id);
  }
}
