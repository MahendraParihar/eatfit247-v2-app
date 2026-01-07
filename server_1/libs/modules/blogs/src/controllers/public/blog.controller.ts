import { Controller, Get, Param, Query } from '@nestjs/common';
import { BlogService } from '../../services';
import { IPublicBlog, IPublicTableList } from '@eatfit247-shared-lib';
import { BasicSearchDto } from '@server_1/shared-dto';
import { Public } from '@server_1/core';

@Public()
@Controller('blog')
export class PublicBlogController {
  constructor(private readonly service: BlogService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<IPublicTableList<IPublicBlog>> {
    // Filter only active blogs
    const searchDto = {
      ...req,
      active: true,
    };
    return await this.service.findAllPublic(searchDto);
  }

  @Get(':id')
  async getById(@Param('id') id: number): Promise<IPublicBlog> {
    return await this.service.fetchByIdPublic(id);
  }

  @Get('by-url/:url')
  async getByUrl(@Param('url') url: string): Promise<IPublicBlog> {
    return await this.service.fetchByUrlPublic(url);
  }
}

