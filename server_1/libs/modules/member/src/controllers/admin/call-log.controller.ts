import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AbilitiesGuard, BasicSearchDto, JwtAuthGuard, RequireAbility } from '@server_1/core';
import { MemberCallLogsService } from '../../services';
import { AdminActionEnum, AdminSubjectEnum, IMemberCallLog, ITableList } from '@eatfit247-shared-lib';

@Controller('call-log')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class CallLogController {
  constructor(
    private readonly memberCallLogsService: MemberCallLogsService,
  ) {}

  @Get('list')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.MemberCallLogs)
  async list(@Query() req: BasicSearchDto & { search?: string }): Promise<ITableList<IMemberCallLog>> {
    return await this.memberCallLogsService.findAll(req);
  }
}
