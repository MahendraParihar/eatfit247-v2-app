import { Controller, Get } from '@nestjs/common';
import { BlogCategoryService } from '../../services';
import { Public } from '@server_1/core';
import { IBlogCategory } from '@eatfit247-shared-lib';

@Public()
@Controller('blog-category')
export class PublicBlogCategoryController {
  constructor(private readonly service: BlogCategoryService) {}

  @Get('list')
  async list(): Promise<IBlogCategory[]> {
    const result = await this.service.findAll({ page: 0, limit: 1000 });
    // Return only active categories
    return result.tableData.filter((category) => category.active);
  }
}

