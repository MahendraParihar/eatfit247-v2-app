// Public Blog Controller
// TODO: Implement public blog controller for public API endpoints
import { Controller, Get, Param, Query } from '@nestjs/common';
import { BlogService } from '../../services';

@Controller('blog')
export class PublicBlogController {
  constructor(
    private readonly service: BlogService,
  ) {}

  @Get('list')
  async list(@Query() req: any) {
    // TODO: Implement public blog listing
    return {};
  }

  @Get(':id')
  async getById(@Param('id') id: number) {
    // TODO: Implement public blog detail
    return {};
  }
}

