import { Controller, Get, Query } from '@nestjs/common';
import { ReligionService } from '../../services';
import { ITableList, IReligion } from '@eatfit247-shared-lib';
import { BasicSearchDto } from '@server/common';

@Controller('public/religion')
export class PublicReligionController {
  constructor(private readonly service: ReligionService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IReligion>> {
    return await this.service.findAll(req);
  }
}

