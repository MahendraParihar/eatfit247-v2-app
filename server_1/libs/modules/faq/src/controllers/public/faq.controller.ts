import { Controller, Get, Query } from '@nestjs/common';
import { FaqService } from '../../services/faq.service';
import { IFaq, ITableList } from '@eatfit247-shared-lib';
import { BasicSearchDto } from '@server_1/shared-dto';

@Controller('faq')
export class PublicFaqController {
  constructor(private readonly service: FaqService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IFaq>> {
    return await this.service.findAll(req);
  }
}

