import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { BasicSearchDto, CurrentUser, JwtAuthGuard, RequestedIp, UpdateActiveDto } from '@server_1/core';
import { CurrencyService } from '@server_1/platform';
import { ProductService } from '../../services';
import { CreateProductDto } from '../../dto';
import { IDropdownItem, IProduct, ITableList } from '@eatfit247-shared-lib';

@Controller('product')
@UseGuards(JwtAuthGuard)
export class ProductController {
  constructor(
    private readonly service: ProductService,
    private readonly currencyService: CurrencyService,
  ) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IProduct>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  async getById(@Param('id') id: number): Promise<IProduct> {
    return await this.service.fetchById(id);
  }

  @Post('manage')
  async create(
    @Body() body: CreateProductDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.create(body, requestedIp, currentUser.adminId);
  }

  @Put('manage/:id')
  async update(
    @Param('id') id: number,
    @Body() body: CreateProductDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.update(id, body, requestedIp, currentUser.adminId);
  }

  @Patch('update-status/:id')
  async changeStatus(
    @Param('id') id: number,
    @Body() body: UpdateActiveDto,
    @CurrentUser() currentUser: any,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.changeStatus(
      id,
      body.active,
      requestedIp,
      currentUser.adminId,
    );
  }

  @Get('product-master')
  async productMasterData(): Promise<{
    currencies: IDropdownItem[];
  }> {
    const currencies = await this.currencyService.getAllCurrencies();
    return {
      currencies: currencies.map((s: any) => {return { id: s.currencyCode, label: s.label };}),
    };
  }
}

