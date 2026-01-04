import { Controller, Get, Query } from '@nestjs/common';
import { EatingHabitService } from '../../services';
import { IEatingHabit, ITableList } from '@eatfit247-shared-lib';
import { BasicSearchDto } from '@server_1/shared-dto';

@Controller('public/eating-habit')
export class PublicEatingHabitController {
  constructor(private readonly service: EatingHabitService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IEatingHabit>> {
    return await this.service.findAll(req);
  }
}

