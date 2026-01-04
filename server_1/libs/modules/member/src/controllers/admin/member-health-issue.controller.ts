import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, RequestedIp } from '@server_1/core';
import { MemberHealthIssueService } from '../../services';
import { ITableList, IMemberHealthIssue } from '@eatfit247-shared-lib';

@Controller('member/:id/health-issues')
@UseGuards(JwtAuthGuard)
export class MemberHealthIssueController {
  constructor(private readonly memberHealthIssueService: MemberHealthIssueService) {}

  @Get()
  async getHealthIssues(@Param('id') id: number): Promise<ITableList<IMemberHealthIssue>> {
    return await this.memberHealthIssueService.getList(id, true);
  }

  @Get('list')
  async getHealthIssueList(@Param('id') id: number): Promise<ITableList<IMemberHealthIssue>> {
    return await this.memberHealthIssueService.getList(id, false);
  }

  @Put('manage')
  async manageHealthIssues(
    @Param('id') id: number,
    @Body() body: { healthIssueIds: number[] },
    @CurrentUser() currentUser: any,
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
