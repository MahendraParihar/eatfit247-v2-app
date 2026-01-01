import { Controller, Get, Query } from '@nestjs/common';
import { UrineOutputService } from '../../services';
import { ITableList, IUrineOutput } from '@eatfit247-shared-lib';
import { BasicSearchDto } from '@server/common';

@Controller('public/urine-output')
export class PublicUrineOutputController {
  constructor(private readonly service: UrineOutputService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IUrineOutput>> {
    return await this.service.findAll(req);
  }
}

