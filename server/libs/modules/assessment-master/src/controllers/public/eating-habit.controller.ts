import { Controller, Get, Query } from '@nestjs/common';
import { EatingHabitService } from '../../services';
import { ITableList, IEatingHabit } from 'eatfit247-shared-lib';
import { BasicSearchDto } from '@server/common';

@Controller('public/eating-habit')
export class PublicEatingHabitController {
  constructor(private readonly service: EatingHabitService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IEatingHabit>> {
    return await this.service.findAll(req);
  }
}

