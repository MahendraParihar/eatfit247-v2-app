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
import {
  CalculateProductVariantTaxDto,
  CalculateProductVariantTaxResponseDto,
  CreatePublicCheckoutOrderDto,
  CreatePublicCheckoutPaymentLinkDto,
  VerifyPaymentDto,
} from '../../dto';
import {
  IAddress,
  IManageAddress,
  IPaymentGateway,
  IPaymentLinkResponse,
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
  @Post('member/:memberId/product/payment-link')
  async createPaymentLink(
    @Param('memberId') memberId: number,
    @Body() body: CreatePublicCheckoutPaymentLinkDto,
  ): Promise<IPaymentLinkResponse> {
    let franchisePaymentGatewayId = body.franchisePaymentGatewayId;
    if (!franchisePaymentGatewayId) {
      const gateways = await this.memberProductService.getSupportedPaymentGatewaysForCheckout(
        body.currency,
      );
      if (gateways.length === 0) {
        throw new Error('No payment gateway available');
      }
      const selectedGateway = gateways.find((g) => g.isPrimary) || gateways[0];
      franchisePaymentGatewayId = selectedGateway.franchisePaymentGatewayId;
    }
    return await this.memberProductService.createPaymentLink(memberId, {
      amount: body.amount,
      currency: body.currency,
      franchisePaymentGatewayId,
      description: body.description,
      customer: body.customer,
      notes: body.notes,
    });
  }

  @Public()
  @UseGuards(CheckoutTokenGuard)
  @Post('member/:memberId/product/payment-order')
  async createPaymentOrder(
    @Param('memberId') memberId: number,
    @Body() body: CreatePublicCheckoutPaymentLinkDto,
  ) {
    return await this.memberProductService.createPaymentOrder(memberId, body);
  }

  @Public()
  @UseGuards(CheckoutTokenGuard)
  @Post('member/:memberId/product/verify-payment')
  async verifyPayment(@Param('memberId') memberId: number, @Body() body: VerifyPaymentDto) {
    return await this.memberProductService.verifyPayment(
      memberId,
      body.gatewayCode,
      body.paymentId,
      body.orderId,
      body.signature,
    );
  }

  @Public()
  @UseGuards(CheckoutTokenGuard, RecaptchaGuard)
  @RequireRecaptcha('checkout_order', 0.5)
  @Post('member/:memberId/product/order')
  async createProductOrder(
    @Param('memberId') memberId: number,
    @Body() body: CreatePublicCheckoutOrderDto,
    @RequestedIp() requestedIp: string,
  ) {
    return await this.memberProductService.create(memberId, body, requestedIp);
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
    @Body() body: CalculateProductVariantTaxDto,
  ): Promise<CalculateProductVariantTaxResponseDto> {
    return await this.memberProductService.calculateProductTax(memberId, body);
  }
}
