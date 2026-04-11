import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import {
  AbilitiesGuard,
  BasicSearchDto,
  CurrentUser,
  JwtAuthGuard,
  RequestedIp,
  RequireAbility,
} from '@server_1/core';
import { AdminActionEnum, AdminSubjectEnum, IAuthUser, IIssue, ITableList } from '@eatfit247-shared-lib';
import { MemberIssueService } from '../../services';
import { CreateMemberIssueDto } from '../../dto';

@Controller('issue')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class IssueAdminController {
  constructor(private readonly memberIssueService: MemberIssueService) {}

  @Get('list')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.MemberIssues)
  async list(@Query() query: BasicSearchDto): Promise<ITableList<IIssue>> {
    return this.memberIssueService.findAllForGlobalIssueAdmin(query);
  }

  @Get('manage/:id')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.MemberIssues)
  async getById(@Param('id', ParseIntPipe) id: number): Promise<IIssue> {
    return this.memberIssueService.getOneForGlobalIssueAdmin(id);
  }

  @Post('manage')
  @RequireAbility(AdminActionEnum.Create, AdminSubjectEnum.MemberIssues)
  async create(
    @Body() body: CreateMemberIssueDto,
    @CurrentUser() user: IAuthUser,
    @RequestedIp() ip: string,
  ): Promise<void> {
    await this.memberIssueService.create(body, ip, user.adminId);
  }

  @Put('manage/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.MemberIssues)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateMemberIssueDto,
    @CurrentUser() user: IAuthUser,
    @RequestedIp() ip: string,
  ): Promise<void> {
    await this.memberIssueService.update(id, body, ip, user.adminId);
  }
}
