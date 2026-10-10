import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
  CheckoutTokenGuard,
  CheckoutTokenIssuedAt,
  checkoutSessionStart,
  Public,
  RequestedIp,
  RequireRecaptcha,
} from '@server_1/core';
import { RecaptchaGuard } from '@server_1/platform';
import { MemberPlanService } from '../../services';
import { PublicPlanOrderDto, PublicPlanTaxCalculationDto, PublicVerifyPaymentDto } from '../../dto';
import {
  IPaymentGateway,
  IPublicCheckoutOrderResponse,
  IPublicPlanTaxCalculationResponse,
  IPublicVerifyPaymentResponse,
} from '@eatfit247-shared-lib';

@Public()
@Controller('checkout/plan')
export class PublicCheckoutPlanController {
  constructor(private readonly memberPaymentService: MemberPlanService) {}

  @UseGuards(CheckoutTokenGuard)
  @Post('member/:memberId/calculate-tax')
  async calculateTax(
    @Param('memberId') memberId: number,
    @Body() body: PublicPlanTaxCalculationDto,
  ): Promise<IPublicPlanTaxCalculationResponse> {
    return await this.memberPaymentService.calculatePublicTax(memberId, body);
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
   * Verify payment after the gateway checkout callback. The server checks the signature
   * with the order's gateway, fetches the payment, and confirms it only if captured.
   */
  @UseGuards(CheckoutTokenGuard)
  @Post('member/:memberId/verify-payment')
  async verifyPayment(
    @Param('memberId') memberId: number,
    @Body() body: PublicVerifyPaymentDto,
    @RequestedIp() requestedIp: string,
  ): Promise<IPublicVerifyPaymentResponse> {
    return await this.memberPaymentService.verifyPublicPayment(memberId, body, requestedIp);
  }

  /**
   * Create-before-pay: prices the plan on the server, creates the PENDING payment and
   * the gateway order for its total, and returns the gateway checkout payload.
   */
  @UseGuards(CheckoutTokenGuard, RecaptchaGuard)
  @RequireRecaptcha('checkout_order', 0.5)
  @Post('member/:memberId/order')
  async createPlanOrder(
    @Param('memberId') memberId: number,
    @Body() body: PublicPlanOrderDto,
    @RequestedIp() requestedIp: string,
  ): Promise<IPublicCheckoutOrderResponse> {
    return await this.memberPaymentService.createPublicCheckoutOrder(memberId, body, requestedIp);
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
    @CheckoutTokenIssuedAt() tokenIssuedAt: number | null,
  ): Promise<{ buffer: string; fileName: string }> {
    const invoiceFile = await this.memberPaymentService.generateInvoicePDF(
      memberId,
      paymentId,
      checkoutSessionStart(tokenIssuedAt),
    );
    return {
      buffer: invoiceFile.buffer || '',
      fileName: invoiceFile.fileName,
    };
  }
}

