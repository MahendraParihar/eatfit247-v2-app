import { Controller, Get, Query } from '@nestjs/common';
import { StateService } from '../../services';
import { ITableList, IState } from 'eatfit247-shared-lib';
import { BasicSearchDto } from '@server/common';

@Controller('public/state')
export class PublicStateController {
  constructor(private readonly service: StateService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IState>> {
    return await this.service.findAll(req);
  }
}

