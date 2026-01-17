import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductService } from '../../services';
import { IPublicProduct, IPublicTableList } from '@eatfit247-shared-lib';
import { BasicSearchDto } from '@server_1/core';
import { Public } from '@server_1/core';

@Public()
@Controller('products')
export class PublicProductController {
  constructor(private readonly service: ProductService) {}

  @Get('list')
  async list(
    @Query() req: BasicSearchDto,
  ): Promise<IPublicTableList<IPublicProduct>> {
    return await this.service.findAllPublic(req);
  }

  @Get('slug/:slug')
  async getBySlug(@Param('slug') slug: string): Promise<IPublicProduct> {
    return await this.service.findBySlug(slug);
  }
}

