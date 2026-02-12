import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductService } from '../../services';
import { IPublicProduct, IPublicTableList } from '@eatfit247-shared-lib';
import { BasicSearchDto, Public } from '@server_1/core';

@Public()
@Controller('products')
export class PublicProductController {
  constructor(private readonly service: ProductService) {}

  @Get(':id/:variantId')
  async getById(
    @Param('id') id: number,
    @Param('variantId') variantId: number,
  ): Promise<IPublicProduct> {
    return await this.service.findPublicProduct(id, variantId);
  }

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<IPublicTableList<IPublicProduct>> {
    return await this.service.findAllPublic(req);
  }
}

