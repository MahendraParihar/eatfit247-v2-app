import { Controller, Get, Query } from '@nestjs/common';
import { ReferrerService } from '../../services';
import { BasicSearchDto } from '@server_1/core';
import { Public } from '@server_1/core';
import { IPublicReferrer, ITableList } from '@eatfit247-shared-lib';

@Public()
@Controller('referrer')
export class PublicReferrerController {
  constructor(private readonly service: ReferrerService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IPublicReferrer>> {
    return await this.service.findAllPublic(req);
  }
}

