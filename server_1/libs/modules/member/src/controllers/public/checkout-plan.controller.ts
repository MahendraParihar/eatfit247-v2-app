import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CheckoutTokenGuard, Public, RequestedIp, RequireRecaptcha } from '@server_1/core';
import { RecaptchaGuard } from '@server_1/platform';
import { MemberPlanService } from '../../services';
import {
  CalculateTaxResponseDto,
  CreatePublicCheckoutPaymentLinkDto,
  CreatePublicCheckoutPlanOrderDto,
  PlanTaxCalculationRequestDto,
} from '../../dto';
import { IManageMemberPayment, IPaymentGateway, IPaymentLinkResponse } from '@eatfit247-shared-lib';

@Public()
@Controller('checkout/plan')
export class PublicCheckoutPlanController {
  constructor(private readonly memberPaymentService: MemberPlanService) {}

  @UseGuards(CheckoutTokenGuard)
  @Post('member/:memberId/calculate-tax')
  async calculateTax(
    @Param('memberId') memberId: number,
    @Body() body: PlanTaxCalculationRequestDto,
  ): Promise<CalculateTaxResponseDto> {
    return await this.memberPaymentService.calculateTax(memberId, body);
  }

  @Get('supported-gateways')
  async getSupportedGateways(
    @Query('currency') currency: string = 'INR',
  ): Promise<IPaymentGateway[]> {
    return await this.memberPaymentService.getSupportedPaymentGatewaysForCheckout(currency);
  }

  @Get('/:gatewayOrderId')
  async getPlanOrderByGatewayOrderId(@Param('gatewayOrderId') gatewayOrderId: string) {
    return await this.memberPaymentService.findByGatewayOrderId(gatewayOrderId);
  }

  /**
   * Create a payment link for plan checkout
   */
  @UseGuards(CheckoutTokenGuard)
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
  @UseGuards(CheckoutTokenGuard)
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
  @UseGuards(CheckoutTokenGuard)
  @Post('member/:memberId/verify-payment')
  async verifyPayment(
    @Param('memberId') memberId: number,
    @Body()
    body: {
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
   * This creates the order in the txn_member_payments table
   */
  @UseGuards(CheckoutTokenGuard, RecaptchaGuard)
  @RequireRecaptcha('checkout_order', 0.5)
  @Post('member/:memberId/order')
  async createPlanOrder(
    @Param('memberId') memberId: number,
    @Body() body: CreatePublicCheckoutPlanOrderDto,
    @RequestedIp() requestedIp: string,
  ) {
    body.programId = 1;
    return await this.memberPaymentService.create(memberId, body, requestedIp);
  }

  /**
   * Download invoice for plan order (public endpoint)
   * Returns invoice as base64 buffer for frontend download
   */
  @UseGuards(CheckoutTokenGuard)
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

