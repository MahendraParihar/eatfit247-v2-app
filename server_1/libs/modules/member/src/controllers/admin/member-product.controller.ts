import { Body, Controller, Get, Header, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard, RequestedIp } from '@server_1/core';
import { MemberProductService } from '../../services';
import {
  IAuthUser,
  IMemberProduct,
  IMemberProductMasterData,
  IPaymentLinkResponse,
  ITableList,
} from '@eatfit247-shared-lib';
import {
  CalculateProductVariantTaxDto,
  CalculateProductVariantTaxResponseDto,
  CreateMemberProductDto,
  CreatePaymentLinkDto,
} from '../../dto';
import { IFileModel } from '@server_1/platform';

@Controller('member/:id/product')
@UseGuards(JwtAuthGuard)
export class MemberProductController {
  constructor(private readonly memberProductService: MemberProductService) {}

  @Get('master-data')
  async getMasterData(@Param('id') id: number): Promise<IMemberProductMasterData> {
    return await this.memberProductService.loadMasterData(id);
  }

  @Get('supported-gateways')
  async getSupportedGateways(
    @Param('id') id: number,
    @Query('currency') currency: string,
  ): Promise<
    Array<{
      franchisePaymentGatewayId: number;
      gatewayCode: string;
      gatewayName: string;
      providerCountryCode: string;
      currencyCode: string;
      isPrimary: boolean;
      supportsDomestic: boolean;
      supportsInternational: boolean;
    }>
  > {
    return await this.memberProductService.getSupportedPaymentGateways(id, currency);
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

  @Post('create-payment-link')
  async createPaymentLink(
    @Param('id') id: number,
    @Body() body: CreatePaymentLinkDto,
  ): Promise<IPaymentLinkResponse> {
    return await this.memberProductService.createPaymentLink(id, body);
  }

  @Post('calculate-tax')
  async calculateTax(
    @Param('id') id: number,
    @Body() body: CalculateProductVariantTaxDto,
  ): Promise<CalculateProductVariantTaxResponseDto> {
    return await this.memberProductService.calculateProductTax(id, body);
  }

  @Post()
  async createProductOrder(
    @Param('id') id: number,
    @Body() body: CreateMemberProductDto,
    @CurrentUser() currentUser: IAuthUser,
    @RequestedIp() requestedIp: string,
  ): Promise<IMemberProduct> {
    return await this.memberProductService.create(id, body, requestedIp, currentUser.adminId);
  }

  @Get(':productId/invoice')
  @Header('Content-Type', 'application/pdf')
  async downloadInvoice(
    @Param('id') id: number,
    @Param('productId') productId: number,
  ): Promise<IFileModel> {
    return await this.memberProductService.generateInvoicePDF(id, productId);
  }

  @Post(':productId/regenerate-payment-link')
  async regeneratePaymentLink(
    @Param('id') id: number,
    @Param('productId') productId: number,
  ): Promise<IMemberProduct> {
    return await this.memberProductService.regeneratePaymentLink(id, productId);
  }
}
