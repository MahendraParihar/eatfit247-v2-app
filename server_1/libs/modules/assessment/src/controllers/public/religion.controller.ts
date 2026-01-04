import { Controller, Get, Query } from '@nestjs/common';
import { ReligionService } from '../../services';
import { IReligion, ITableList } from '@eatfit247-shared-lib';
import { BasicSearchDto } from '@server_1/shared-dto';

@Controller('public/religion')
export class PublicReligionController {
  constructor(private readonly service: ReligionService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IReligion>> {
    return await this.service.findAll(req);
  }
}

