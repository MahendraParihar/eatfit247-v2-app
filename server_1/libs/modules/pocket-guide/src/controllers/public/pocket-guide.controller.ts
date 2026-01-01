import { Controller, Get, Query } from '@nestjs/common';
import { PocketGuideService } from '../../services';
import { ITableList, IPocketGuide } from '@eatfit247-shared-lib';
import { BasicSearchDto } from '@server_1/shared-dto';

@Controller('public/pocket-guide')
export class PublicPocketGuideController {
  constructor(private readonly service: PocketGuideService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IPocketGuide>> {
    return await this.service.findAll(req);
  }
}

