import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  CheckoutTokenGuard,
  CreateAddressDto,
  Public,
  RequestedIp,
  RequireRecaptcha,
} from '@server_1/core';
import { AddressService, RecaptchaGuard } from '@server_1/platform';
import { MemberProductService } from '../../services';
import { PublicProductOrderDto, PublicProductTaxCalculationDto, PublicVerifyPaymentDto } from '../../dto';
import {
  IAddress,
  IManageAddress,
  IPaymentGateway,
  IPublicCheckoutOrderResponse,
  IPublicProductTaxCalculationResponse,
  IPublicVerifyPaymentResponse,
  TableEnum,
} from '@eatfit247-shared-lib';

@Controller('checkout')
export class PublicCheckoutController {
  constructor(
    private readonly memberProductService: MemberProductService,
    private readonly addressService: AddressService,
  ) {}

  /**
   * Fully public — no session required.
   * Returns available payment gateways for the given currency.
   */
  @Public()
  @Get('product/supported-gateways')
  async getSupportedGateways(
    @Param('currency') currency: string = 'INR',
  ): Promise<IPaymentGateway[]> {
    return await this.memberProductService.getSupportedPaymentGatewaysForCheckout(currency);
  }

  /**
   * Fully public — Razorpay order IDs are long opaque strings, effectively
   * capability URLs.  Used by the frontend to poll order status after redirect.
   */
  @Public()
  @Get('order/:gatewayOrderId')
  async getOrderByGatewayOrderId(@Param('gatewayOrderId') gatewayOrderId: string) {
    return await this.memberProductService.findByGatewayOrderId(gatewayOrderId);
  }

  // ─── Member-scoped routes — CheckoutTokenGuard required ─────────────────────
  // The guard verifies the signed token issued by POST /member/create and
  // ensures the :memberId in the URL matches the token's subject claim.
  // This prevents any user from touching another member's data or invoices.
  // @Public() is required on every route here so the global JwtAuthGuard
  // (registered via CommonModule) skips JWT validation — CheckoutTokenGuard
  // provides the security instead.

  @Public()
  @UseGuards(CheckoutTokenGuard)
  @Post('member/:memberId/address')
  async createAddress(
    @Param('memberId') memberId: number,
    @Body() body: CreateAddressDto,
    @RequestedIp() requestedIp: string,
  ): Promise<IAddress> {
    const addressData: IManageAddress = {
      tableId: TableEnum.TXN_MEMBER,
      pkOfTable: memberId,
      postalAddress: body.postalAddress,
      cityVillage: body.cityVillage,
      stateId: body.stateId,
      countryId: body.countryId,
      pinCode: body.pinCode,
      latitude: body.latitude,
      longitude: body.longitude,
      addressName: body.addressName,
    };
    return await this.addressService.create(addressData, requestedIp, null);
  }

  @Public()
  @UseGuards(CheckoutTokenGuard)
  @Post('member/:memberId/product/verify-payment')
  async verifyPayment(
    @Param('memberId') memberId: number,
    @Body() body: PublicVerifyPaymentDto,
    @RequestedIp() requestedIp: string,
  ): Promise<IPublicVerifyPaymentResponse> {
    return await this.memberProductService.verifyPublicPayment(memberId, body, requestedIp);
  }

  /**
   * Create-before-pay: prices the variants on the server, creates the PENDING order and
   * the gateway order for its total, and returns the gateway checkout payload.
   */
  @Public()
  @UseGuards(CheckoutTokenGuard, RecaptchaGuard)
  @RequireRecaptcha('checkout_order', 0.5)
  @Post('member/:memberId/product/order')
  async createProductOrder(
    @Param('memberId') memberId: number,
    @Body() body: PublicProductOrderDto,
    @RequestedIp() requestedIp: string,
  ): Promise<IPublicCheckoutOrderResponse> {
    return await this.memberProductService.createPublicCheckoutOrder(memberId, body, requestedIp);
  }

  @Public()
  @UseGuards(CheckoutTokenGuard)
  @Get('member/:memberId/product/:productId/invoice')
  async downloadInvoice(
    @Param('memberId') memberId: number,
    @Param('productId') productId: number,
  ): Promise<{ buffer: string; fileName: string }> {
    const invoiceFile = await this.memberProductService.generateInvoicePDF(memberId, productId);
    return {
      buffer: invoiceFile.buffer || '',
      fileName: invoiceFile.fileName,
    };
  }

  @Public()
  @UseGuards(CheckoutTokenGuard)
  @Post('member/:memberId/calculate-tax')
  async calculateTax(
    @Param('memberId') memberId: number,
    @Body() body: PublicProductTaxCalculationDto,
  ): Promise<IPublicProductTaxCalculationResponse> {
    return await this.memberProductService.calculatePublicProductTax(memberId, body);
  }
}
