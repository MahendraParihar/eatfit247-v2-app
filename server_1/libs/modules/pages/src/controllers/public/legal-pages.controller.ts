import { Controller, Get, Param, Query } from '@nestjs/common';
import { LegalPagesService } from '../../services/legal-pages.service';
import { ITableList, ILegalPageList } from '@eatfit247-shared-lib';
import { BasicSearchDto } from '@server_1/shared-dto';

@Controller('public/legal-page')
export class PublicLegalPagesController {
  constructor(private readonly service: LegalPagesService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<ILegalPageList>> {
    return await this.service.findAll(req);
  }

  @Get('by-url/:url')
  async getByUrl(@Param('url') url: string): Promise<ILegalPageList> {
    return await this.service.getByUrl(url);
  }
}

