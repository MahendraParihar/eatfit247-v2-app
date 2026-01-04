import { Controller, Get, Query } from '@nestjs/common';
import { SleepingPatternService } from '../../services';
import { ISleepingPattern, ITableList } from '@eatfit247-shared-lib';
import { BasicSearchDto } from '@server_1/shared-dto';

@Controller('public/sleeping-pattern')
export class PublicSleepingPatternController {
  constructor(private readonly service: SleepingPatternService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<ISleepingPattern>> {
    return await this.service.findAll(req);
  }
}

