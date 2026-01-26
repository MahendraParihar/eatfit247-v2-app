import { Controller, Get, Query } from '@nestjs/common';
import { PressMediaService } from '../../services';
import { IPublicPressMedia, IPublicTableList } from '@eatfit247-shared-lib';
import { BasicSearchDto, Public } from '@server_1/core';

@Public()
@Controller('press-media')
export class PublicPressMediaController {
  constructor(private readonly service: PressMediaService) {}

  @Get('list')
  async list(
    @Query() req: BasicSearchDto & { type?: 'youtube' | 'press' },
  ): Promise<IPublicTableList<IPublicPressMedia>> {
    // Filter only active press media
    const searchDto = {
      ...req,
      active: true,
    };
    return await this.service.findAllPublic(searchDto);
  }
}

