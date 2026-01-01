import { Controller, Get, Query } from '@nestjs/common';
import { MaritalStatusService } from '../../services';
import { ITableList, IMaritalStatus } from '@eatfit247-shared-lib';
import { BasicSearchDto } from '@server/common';

@Controller('public/marital-status')
export class PublicMaritalStatusController {
  constructor(private readonly service: MaritalStatusService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IMaritalStatus>> {
    return await this.service.findAll(req);
  }
}

