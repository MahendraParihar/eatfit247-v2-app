import { Controller, Get, Param, Query } from '@nestjs/common';
import { FaqService } from '../../services';
import { IPublicFaq, IPublicTableList } from '@eatfit247-shared-lib';
import { BasicSearchDto } from '@server_1/core';
import { Public } from '@server_1/core';

@Public()
@Controller('faq')
export class PublicFaqController {
  constructor(private readonly service: FaqService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<IPublicTableList<IPublicFaq>> {
    // Filter only active FAQs
    const searchDto = {
      ...req,
      active: true,
    };
    return await this.service.findAllPublic(searchDto);
  }

  @Get('by-category-url/:url')
  async getByCategoryUrl(
    @Param('url') url: string,
    @Query() req?: BasicSearchDto
  ): Promise<IPublicTableList<IPublicFaq>> {
    return await this.service.findByCategoryUrl(url, req);
  }
}

