import { Controller, Get, Query } from '@nestjs/common';
import { BannerService } from '../../services';
import { IPublicBanner, IPublicTableList, BannerForEnum } from '@eatfit247-shared-lib';
import { BasicSearchDto } from '@server_1/shared-dto';
import { Public } from '@server_1/core';

@Public()
@Controller('banners')
export class PublicBannerController {
  constructor(private readonly service: BannerService) {}

  @Get('list')
  async list(
    @Query() req: BasicSearchDto & { bannerFor?: BannerForEnum },
  ): Promise<IPublicTableList<IPublicBanner>> {
    // Filter only active banners
    const searchDto = {
      ...req,
      active: true,
    };
    return await this.service.findAllPublic(searchDto);
  }
}

