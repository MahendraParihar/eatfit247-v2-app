import { Controller, Get, Query } from '@nestjs/common';
import { StateService } from '@server_1/platform';
import { IState, ITableList } from '@eatfit247-shared-lib';
import { BasicSearchDto } from '@server_1/shared-dto';

@Controller('public/state')
export class PublicStateController {
  constructor(private readonly service: StateService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IState>> {
    return await this.service.findAll(req);
  }
}

