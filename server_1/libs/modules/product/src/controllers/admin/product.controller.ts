import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import {
  AbilitiesGuard,
  BasicSearchDto,
  CurrentUser,
  JwtAuthGuard,
  RequestedIp,
  RequireAbility,
  UpdateActiveDto,
} from '@server_1/core';
import { CurrencyService } from '@server_1/platform';
import { ProductService } from '../../services';
import { CreateProductDto } from '../../dto';
import { AdminActionEnum, AdminSubjectEnum, IAuthUser, IDropdownItem, IProduct, ITableList } from '@eatfit247-shared-lib';

@Controller('product')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class ProductController {
  constructor(
    private readonly service: ProductService,
    private readonly currencyService: CurrencyService,
  ) {}

  @Get('list')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Product)
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IProduct>> {
    return await this.service.findAll(req);
  }

  @Get('manage/:id')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Product)
  async getById(@Param('id') id: number): Promise<IProduct> {
    return await this.service.fetchById(id);
  }

  @Post('manage')
  @RequireAbility(AdminActionEnum.Create, AdminSubjectEnum.Product)
  async create(
    @Body() body: CreateProductDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.create(body, requestedIp, currentUser.adminId);
  }

  @Put('manage/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.Product)
  async update(
    @Param('id') id: number,
    @Body() body: CreateProductDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.update(id, body, requestedIp, currentUser.adminId);
  }

  @Patch('update-status/:id')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.Product)
  async changeStatus(
    @Param('id') id: number,
    @Body() body: UpdateActiveDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<void> {
    await this.service.changeStatus(id, body.active, requestedIp, currentUser.adminId);
  }

  @Get('product-master')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.Product)
  async productMasterData(): Promise<{
    currencies: IDropdownItem[];
  }> {
    const currencies = await this.currencyService.getAllCurrencies();
    return {
      currencies: currencies.map((s: any) => {
        return { id: s.currencyCode, label: s.label };
      }),
    };
  }
}

