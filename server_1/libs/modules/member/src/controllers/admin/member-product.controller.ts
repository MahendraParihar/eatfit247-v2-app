import { Body, Controller, Get, Header, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AbilitiesGuard, CurrentUser, JwtAuthGuard, RequestedIp, RequireAbility } from '@server_1/core';
import { MemberProductService } from '../../services';
import {
  AdminActionEnum,
  AdminSubjectEnum,
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
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class MemberProductController {
  constructor(private readonly memberProductService: MemberProductService) {}

  @Get('master-data')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.MemberProducts)
  async getMasterData(@Param('id') id: number): Promise<IMemberProductMasterData> {
    return await this.memberProductService.loadMasterData(id);
  }

  @Get('supported-gateways')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.MemberProducts)
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
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.MemberProducts)
  async getProductList(@Param('id') id: number): Promise<ITableList<IMemberProduct>> {
    return await this.memberProductService.findAll(id);
  }

  @Get(':productId')
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.MemberProducts)
  async getProductById(
    @Param('id') id: number,
    @Param('productId') productId: number,
  ): Promise<IMemberProduct> {
    return await this.memberProductService.findById(id, productId);
  }

  @Post('create-payment-link')
  @RequireAbility(AdminActionEnum.Create, AdminSubjectEnum.MemberProducts)
  async createPaymentLink(
    @Param('id') id: number,
    @Body() body: CreatePaymentLinkDto,
  ): Promise<IPaymentLinkResponse> {
    return await this.memberProductService.createPaymentLink(id, body);
  }

  @Post('calculate-tax')
  @RequireAbility(AdminActionEnum.Create, AdminSubjectEnum.MemberProducts)
  async calculateTax(
    @Param('id') id: number,
    @Body() body: CalculateProductVariantTaxDto,
  ): Promise<CalculateProductVariantTaxResponseDto> {
    return await this.memberProductService.calculateProductTax(id, body);
  }

  @Post()
  @RequireAbility(AdminActionEnum.Create, AdminSubjectEnum.MemberProducts)
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
  @RequireAbility(AdminActionEnum.Read, AdminSubjectEnum.MemberProducts)
  async downloadInvoice(
    @Param('id') id: number,
    @Param('productId') productId: number,
  ): Promise<IFileModel> {
    return await this.memberProductService.generateInvoicePDF(id, productId);
  }

  @Post(':productId/regenerate-payment-link')
  @RequireAbility(AdminActionEnum.Update, AdminSubjectEnum.MemberProducts)
  async regeneratePaymentLink(
    @Param('id') id: number,
    @Param('productId') productId: number,
  ): Promise<IMemberProduct> {
    return await this.memberProductService.regeneratePaymentLink(id, productId);
  }
}
