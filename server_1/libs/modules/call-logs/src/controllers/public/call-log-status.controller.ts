import { Controller, Get, Query } from '@nestjs/common';
import { CallLogStatusService } from '../../services';
import { ITableList, ICallLogStatus } from '@eatfit247-shared-lib';
import { BasicSearchDto } from '@server_1/shared-dto';

@Controller('public/call-log-status')
export class PublicCallLogStatusController {
  constructor(private readonly service: CallLogStatusService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<ICallLogStatus>> {
    return await this.service.findAll(req);
  }
}

