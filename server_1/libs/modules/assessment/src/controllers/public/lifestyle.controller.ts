import { Controller, Get, Query } from '@nestjs/common';
import { LifestyleService } from '../../services';
import { ITableList, ILifestyle } from '@eatfit247-shared-lib';
import { BasicSearchDto } from '@server_1/shared-dto';

@Controller('public/lifestyle')
export class PublicLifestyleController {
  constructor(private readonly service: LifestyleService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<ILifestyle>> {
    return await this.service.findAll(req);
  }
}

