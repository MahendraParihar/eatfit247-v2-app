import { Controller, Get, Query } from '@nestjs/common';
import { PressMediaService } from '../../services';
import { ITableList, IPressMedia } from 'eatfit247-shared-lib';
import { BasicSearchDto } from '@server/common';

@Controller('public/press-media')
export class PublicPressMediaController {
  constructor(private readonly service: PressMediaService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IPressMedia>> {
    return await this.service.findAll(req);
  }
}

