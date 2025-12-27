import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, RequestedIp, BasicSearchDto } from '@server/common';
import { MemberService, MemberPocketGuideService, MemberHealthIssueService, MemberCallLogsService } from '../../services';
import { CreateMemberDto } from '../../dto';
import { ITableList, IMember, IResponse, IMemberPocketGuide, IMemberHealthIssue, IMemberCallLog } from 'eatfit247-shared-lib';

@Controller('member')
@UseGuards(JwtAuthGuard)
export class MemberController {
  constructor(
    private readonly service: MemberService,
    private readonly memberPocketGuideService: MemberPocketGuideService,
    private readonly memberHealthIssueService: MemberHealthIssueService,
    private readonly memberCallLogsService: MemberCallLogsService,
  ) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IMember>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  async getById(@Param('id') id: number): Promise<IResponse<IMember>> {
    const data = await this.service.fetchById(id);
    return { data };
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
  async getPocketGuides(@Param('id') id: number): Promise<IResponse<IMemberPocketGuide[]>> {
    const data = await this.memberPocketGuideService.findByMemberId(id);
    return { data };
  }

  @Get(':id/health-issues')
  async getHealthIssues(@Param('id') id: number): Promise<IResponse<IMemberHealthIssue[]>> {
    const data = await this.memberHealthIssueService.findByMemberId(id);
    return { data };
  }

  @Get(':id/call-logs')
  async getCallLogs(@Param('id') id: number): Promise<IResponse<IMemberCallLog[]>> {
    const data = await this.memberCallLogsService.findByMemberId(id);
    return { data };
  }
}
