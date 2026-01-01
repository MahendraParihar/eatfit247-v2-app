import { Controller, Get, Query } from '@nestjs/common';
import { ReferrerService } from '../../services';
import { ITableList, IReferrer } from '@eatfit247-shared-lib';
import { BasicSearchDto } from '@server/common';

@Controller('public/referrer')
export class PublicReferrerController {
  constructor(private readonly service: ReferrerService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IReferrer>> {
    return await this.service.findAll(req);
  }
}

