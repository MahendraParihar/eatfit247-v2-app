import { Controller, Get, Query } from '@nestjs/common';
import { FaqService } from '../../services';
import { IPublicFaq, IPublicTableList } from '@eatfit247-shared-lib';
import { BasicSearchDto } from '@server_1/shared-dto';
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
}

