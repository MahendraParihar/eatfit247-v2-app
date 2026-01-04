import { Controller, Get, Query } from '@nestjs/common';
import { GenderService } from '../../services';
import { IGender, ITableList } from '@eatfit247-shared-lib';
import { BasicSearchDto } from '@server_1/shared-dto';

@Controller('public/gender')
export class PublicGenderController {
  constructor(private readonly service: GenderService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IGender>> {
    return await this.service.findAll(req);
  }
}

