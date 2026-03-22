import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import {
  AbilitiesGuard,
  CurrentUser,
  JwtAuthGuard,
  RequestedIp,
  RequireAbility,
  UpdateHealthIssueIdsDto,
} from '@server_1/core';
import { MemberHealthIssueService } from '../../services';
import { AdminActionEnum, AdminSubjectEnum, IAuthUser, IMemberHealthIssue, ITableList } from '@eatfit247-shared-lib';

@Controller('member/:id/health-issues')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class MemberHealthIssueController {
  constructor(private readonly memberHealthIssueService: MemberHealthIssueService) {}

  @Get()
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.MemberHealth)
  async getHealthIssues(@Param('id') id: number): Promise<ITableList<IMemberHealthIssue>> {
    return await this.memberHealthIssueService.getList(id, true);
  }

  @Get('list')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.MemberHealth)
  async getHealthIssueList(@Param('id') id: number): Promise<ITableList<IMemberHealthIssue>> {
    return await this.memberHealthIssueService.getList(id, false);
  }

  @Put('manage')
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
}
