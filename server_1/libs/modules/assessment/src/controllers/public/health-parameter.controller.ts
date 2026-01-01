import { Controller, Get, Query } from '@nestjs/common';
import { HealthParameterService } from '../../services';
import { ITableList, IHealthParameter } from '@eatfit247-shared-lib';
import { BasicSearchDto } from '@server_1/shared-dto';

@Controller('public/health-parameter')
export class PublicHealthParameterController {
  constructor(private readonly service: HealthParameterService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IHealthParameter>> {
    return await this.service.findAll(req);
  }
}

