import { Body, Controller, Get, Header, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CreateAddressDto, Public, RequestedIp, RequireRecaptcha } from '@server_1/core';
import { AddressService, RecaptchaGuard } from '@server_1/platform';
import { MemberProductService } from '../../services';
import { CreatePublicCheckoutOrderDto, CreatePublicCheckoutPaymentLinkDto } from '../../dto';
import { IAddress, IManageAddress, IPaymentLinkResponse, IManageMemberProduct, TableEnum } from '@eatfit247-shared-lib';

@Public()
@Controller('checkout')
export class PublicCheckoutController {
  constructor(
    private readonly memberProductService: MemberProductService,
    private readonly addressService: AddressService,
  ) {}

  /**
   * Get supported payment gateways for product checkout
   * Based on franchise for products (BusinessTypeEnum.PRODUCT)
   */
  @Get('product/supported-gateways')
  async getSupportedGateways(
    @Query('currency') currency: string = 'INR',
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
    return await this.memberProductService.getSupportedPaymentGatewaysForCheckout(currency);
  }

  /**
   * Create address for member during checkout
   */
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

  /**
   * Create a payment link for product checkout
   */
  @Post('member/:memberId/product/payment-link')
  async createPaymentLink(
    @Param('memberId') memberId: number,
    @Body() body: CreatePublicCheckoutPaymentLinkDto,
  ): Promise<IPaymentLinkResponse> {
    // Resolve gateway if not provided
    let franchisePaymentGatewayId = body.franchisePaymentGatewayId;
    if (!franchisePaymentGatewayId) {
      const gateways = await this.memberProductService.getSupportedPaymentGatewaysForCheckout(
        body.currency || 'INR',
      );
      if (gateways.length === 0) {
        throw new Error('No payment gateway available');
      }
      // Use primary gateway or first available
      const selectedGateway = gateways.find((g) => g.isPrimary) || gateways[0];
      franchisePaymentGatewayId = selectedGateway.franchisePaymentGatewayId;
    }
    const paymentLinkRequest = {
      amount: body.amount,
      currency: body.currency,
      franchisePaymentGatewayId,
      description: body.description,
      customer: body.customer,
      notes: body.notes,
    };
    return await this.memberProductService.createPaymentLink(memberId, paymentLinkRequest);
  }

  /**
   * Create payment order for embedded checkout
   * Returns order details that can be used with payment gateway SDKs
   */
  @Post('member/:memberId/product/payment-order')
  async createPaymentOrder(
    @Param('memberId') memberId: number,
    @Body() body: CreatePublicCheckoutPaymentLinkDto,
  ) {
    const paymentOrderRequest = {
      amount: body.amount,
      currency: body.currency,
      franchisePaymentGatewayId: body.franchisePaymentGatewayId,
      description: body.description,
      customer: body.customer,
      notes: body.notes,
    };
    return await this.memberProductService.createPaymentOrder(memberId, paymentOrderRequest);
  }

  /**
   * Verify payment after completion
   */
  @Post('member/:memberId/product/verify-payment')
  async verifyPayment(
    @Param('memberId') memberId: number,
    @Body() body: {
      gatewayCode: string;
      paymentId: string;
      orderId?: string;
      signature?: string;
    },
  ) {
    return await this.memberProductService.verifyPayment(
      memberId,
      body.gatewayCode,
      body.paymentId,
      body.orderId,
      body.signature,
    );
  }

  /**
   * Create product order for checkout
   * This creates the order in txn_member_products table
   */
  @UseGuards(RecaptchaGuard)
  @RequireRecaptcha('checkout_order', 0.5)
  @Post('member/:memberId/product/order')
  async createProductOrder(
    @Param('memberId') memberId: number,
    @Body() body: CreatePublicCheckoutOrderDto,
    @RequestedIp() requestedIp: string,
  ) {
    // Convert public DTO to internal format and create order
    // Map DTO to IManageMemberProduct interface format
    const orderData: IManageMemberProduct = {
      memberId,
      paymentModeId: body.paymentModeId,
      billingAddressId: body.billingAddressId,
      addressId: body.addressId,
      transactionId: body.transactionId,
      paymentDate: body.paymentDate,
      paymentStatusId: body.paymentStatusId,
      promoCode: body.promoCode,
      gstNumber: body.gstNumber,
      paymentSource: body.paymentSource,
      subTotalAmount: body.orderAmount,
      taxAmount: body.taxAmount,
      discountAmount: body.discountAmount,
      totalAmount: body.totalAmount,
      currency: body.currencyCode,
      paymentLink: body.paymentLink,
      gatewayProvider: body.gatewayProvider,
      gatewayOrderId: body.gatewayOrderId,
      gatewayPaymentId: body.gatewayPaymentId,
      paymentGatewayResponse: body.paymentGatewayResponse,
      orderItems: body.orderItems,
    };
    return await this.memberProductService.createPublicOrder(memberId, orderData, requestedIp);
  }

  /**
   * Get order details by gateway order ID
   */
  @Get('order/:gatewayOrderId')
  async getOrderByGatewayOrderId(
    @Param('gatewayOrderId') gatewayOrderId: string,
  ) {
    return await this.memberProductService.findByGatewayOrderId(gatewayOrderId);
  }

  /**
   * Download invoice for product order (public endpoint)
   * Returns invoice as base64 buffer for frontend download
   */
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
}

