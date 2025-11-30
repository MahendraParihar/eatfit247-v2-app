import { Controller, Get, Query } from '@nestjs/common';
import { CallPurposeService } from '../../services';
import { ITableList, ICallPurpose } from 'eatfit247-shared-lib';
import { BasicSearchDto } from '@server/common';

@Controller('public/call-purpose')
export class PublicCallPurposeController {
  constructor(private readonly service: CallPurposeService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<ICallPurpose>> {
    return await this.service.findAll(req);
  }
}

