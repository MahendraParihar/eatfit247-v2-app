import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { BasicSearchDto, JwtAuthGuard } from '@server_1/core';
import { MemberCallLogsService } from '../../services';
import { IMemberCallLog, ITableList } from '@eatfit247-shared-lib';

@Controller('call-log')
@UseGuards(JwtAuthGuard)
export class CallLogController {
  constructor(
    private readonly memberCallLogsService: MemberCallLogsService,
  ) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto & { search?: string }): Promise<ITableList<IMemberCallLog>> {
    return await this.memberCallLogsService.findAll(req);
  }
}
