import { Controller, Get, Param, Query } from '@nestjs/common';
import { BlogService } from '../../services';
import { IBlog, ITableList } from '@eatfit247-shared-lib';
import { BasicSearchDto } from '@server_1/shared-dto';

@Controller('blog')
export class PublicBlogController {
  constructor(
    private readonly service: BlogService,
  ) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IBlog>> {
    return await this.service.findAllPublic(req);
  }

  @Get(':id')
  async getById(@Param('id') id: number): Promise<IBlog> {
    return await this.service.fetchByIdPublic(id);
  }

  @Get('by-url/:url')
  async getByUrl(@Param('url') url: string): Promise<IBlog> {
    return await this.service.fetchByUrlPublic(url);
  }
}

