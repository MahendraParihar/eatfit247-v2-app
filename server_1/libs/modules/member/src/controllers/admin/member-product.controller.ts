import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@server_1/core';
import { MemberProductService } from '../../services';
import { IMemberProduct, IMemberProductMasterData, ITableList } from '@eatfit247-shared-lib';

@Controller('member/:id/product')
@UseGuards(JwtAuthGuard)
export class MemberProductController {
  constructor(private readonly memberProductService: MemberProductService) {}

  @Get('master-data')
  async getMasterData(@Param('id') id: number): Promise<IMemberProductMasterData> {
    return await this.memberProductService.loadMasterData(id);
  }

  @Get('list')
  async getProductList(@Param('id') id: number): Promise<ITableList<IMemberProduct>> {
    return await this.memberProductService.findAll(id);
  }

  @Get(':productId')
  async getProductById(
    @Param('id') id: number,
    @Param('productId') productId: number,
  ): Promise<IMemberProduct> {
    return await this.memberProductService.findById(id, productId);
  }
}

