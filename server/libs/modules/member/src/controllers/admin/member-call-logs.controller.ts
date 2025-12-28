import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@server/common';
import { MemberCallLogsService } from '../../services';
import { IMemberCallLog } from 'eatfit247-shared-lib';

@Controller('member/:id/call-logs')
@UseGuards(JwtAuthGuard)
export class MemberCallLogsController {
  constructor(private readonly memberCallLogsService: MemberCallLogsService) {}

  @Get()
  async getCallLogs(@Param('id') id: number): Promise<IMemberCallLog[]> {
    return await this.memberCallLogsService.findByMemberId(id);
  }
}
