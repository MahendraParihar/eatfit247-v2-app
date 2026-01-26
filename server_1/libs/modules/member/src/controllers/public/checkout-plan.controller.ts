import { Body, Controller, Get, Header, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CreateAddressDto, Public, RequestedIp, RequireRecaptcha } from '@server_1/core';
import { AddressService, RecaptchaGuard } from '@server_1/platform';
import { MemberPaymentService } from '../../services';
import { CreatePublicCheckoutPaymentLinkDto, CreatePublicCheckoutPlanOrderDto } from '../../dto';
import { IAddress, IManageAddress, IPaymentLinkResponse, IManageMemberPayment, TableEnum } from '@eatfit247-shared-lib';

@Public()
@Controller('checkout/plan')
export class PublicCheckoutPlanController {
  constructor(
    private readonly memberPaymentService: MemberPaymentService,
    private readonly addressService: AddressService,
  ) {}

  /**
   * Get supported payment gateways for plan checkout
   * Based on franchise for services (BusinessTypeEnum.SERVICE)
   */
  @Get('supported-gateways')
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
    return await this.memberPaymentService.getSupportedPaymentGatewaysForCheckout(currency);
  }

  /**
   * Create a payment link for plan checkout
   */
  @Post('member/:memberId/payment-link')
  async createPaymentLink(
    @Param('memberId') memberId: number,
    @Body() body: CreatePublicCheckoutPaymentLinkDto,
  ): Promise<IPaymentLinkResponse> {
    // Resolve gateway if not provided
    let franchisePaymentGatewayId = body.franchisePaymentGatewayId;
    if (!franchisePaymentGatewayId) {
      const gateways = await this.memberPaymentService.getSupportedPaymentGatewaysForCheckout(
        body.currency || 'INR',
      );
      if (gateways.length === 0) {
        throw new Error('No payment gateway available');
      }
      // Use the primary gateway or first available
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
    return await this.memberPaymentService.createPaymentLink(memberId, paymentLinkRequest);
  }

  /**
   * Create payment order for embedded checkout
   * Returns order details that can be used with payment gateway SDKs
   */
  @Post('member/:memberId/payment-order')
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
    return await this.memberPaymentService.createPaymentOrder(memberId, paymentOrderRequest);
  }

  /**
   * Verify payment after completion
   */
  @Post('member/:memberId/verify-payment')
  async verifyPayment(
    @Param('memberId') memberId: number,
    @Body() body: {
      gatewayCode: string;
      paymentId: string;
      orderId?: string;
      signature?: string;
    },
  ) {
    return await this.memberPaymentService.verifyPayment(
      memberId,
      body.gatewayCode,
      body.paymentId,
      body.orderId,
      body.signature,
    );
  }

  /**
   * Create plan order for checkout
   * This creates the order in txn_member_payments table
   */
  @UseGuards(RecaptchaGuard)
  @RequireRecaptcha('checkout_order', 0.5)
  @Post('member/:memberId/order')
  async createPlanOrder(
    @Param('memberId') memberId: number,
    @Body() body: CreatePublicCheckoutPlanOrderDto,
    @RequestedIp() requestedIp: string,
  ) {
    const orderData: IManageMemberPayment = {
      memberId,
      paymentModeId: body.paymentModeId,
      billingAddressId: body.billingAddressId,
      addressId: body.addressId,
      transactionId: body.transactionId,
      paymentDate: body.paymentDate,
      paymentStatusId: body.paymentStatusId,
      programId: body.programId,
      programPlanId: body.programPlanId,
      noOfCycle: body.noOfCycle,
      noOfDaysInCycle: body.noOfDaysInCycle,
      promoCode: body.promoCode,
      gstNumber: body.gstNumber,
      paymentSource: body.paymentSource,
      isTaxApplicable: body.isTaxApplicable,
      taxPercentage: body.taxPercentage,
      orderAmount: body.orderAmount,
      taxAmount: body.taxAmount,
      discountAmount: body.discountAmount,
      totalAmount: body.totalAmount,
      currencyCode: body.currencyCode,
      paymentLink: body.paymentLink,
      gatewayProvider: body.gatewayProvider,
      gatewayOrderId: body.gatewayOrderId,
      paymentGatewayResponse: body.paymentGatewayResponse,
    };
    return await this.memberPaymentService.createPublicOrder(memberId, orderData, requestedIp);
  }

  /**
   * Download invoice for plan order (public endpoint)
   * Returns invoice as base64 buffer for frontend download
   */
  @Get('member/:memberId/payment/:paymentId/invoice')
  async downloadInvoice(
    @Param('memberId') memberId: number,
    @Param('paymentId') paymentId: number,
  ): Promise<{ buffer: string; fileName: string }> {
    const invoiceFile = await this.memberPaymentService.generateInvoicePDF(memberId, paymentId);
    return {
      buffer: invoiceFile.buffer || '',
      fileName: invoiceFile.fileName,
    };
  }
}

