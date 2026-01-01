import { Controller, Get, Query } from '@nestjs/common';
import { BloodSugarService } from '../../services';
import { ITableList, IBloodSugar } from '@eatfit247-shared-lib';
import { BasicSearchDto } from '@server/common';

@Controller('public/blood-sugar')
export class PublicBloodSugarController {
  constructor(private readonly service: BloodSugarService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IBloodSugar>> {
    return await this.service.findAll(req);
  }
}

