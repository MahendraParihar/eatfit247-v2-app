import { Controller, Get, Query } from '@nestjs/common';
import { BannerService } from '../../services';
import { IBanner, ITableList, BannerForEnum } from '@eatfit247-shared-lib';
import { BasicSearchDto } from '@server_1/shared-dto';

@Controller('banners')
export class PublicBannerController {
  constructor(private readonly service: BannerService) {}

  @Get('list')
  async list(
    @Query() req: BasicSearchDto & { bannerFor?: BannerForEnum },
  ): Promise<ITableList<IBanner>> {
    // Filter only active banners
    const searchDto = {
      ...req,
      active: true,
    };
    return await this.service.findAll(searchDto);
  }
}

