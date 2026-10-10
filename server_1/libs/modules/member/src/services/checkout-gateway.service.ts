import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '@server_1/core';
import {
  PaymentGatewayCredentialService,
  PaymentGatewayFactory,
  PaymentGatewayResolverService,
} from '@server_1/modules/payment';
import { PromoCodeService } from '@server_1/modules/promo-code';
import {
  ConfigParam,
  CurrencyUtil,
  IPaymentLinkCustomer,
  IPublicCheckoutGatewayPayload,
  PaymentGatewayEnum,
} from '@eatfit247-shared-lib';
import {
  IGatewayConfirmationResult,
  PaymentConfirmationService,
} from './payment-confirmation.service';

export interface IAppliedPromo {
  promoCode: string | null;
  discountAmount: number;
  message?: string;
}

export interface ICreateCheckoutGatewayOrderInput {
  franchiseId: number;
  currency: string;
  /** The stored record total, in major units. */
  amount: number;
  requestedGatewayId?: number;
  receipt: string;
  description: string;
  customer: IPaymentLinkCustomer;
  notes: Record<string, string>;
}

export interface ICheckoutGatewayOrder extends IPublicCheckoutGatewayPayload {
  franchisePaymentGatewayId: number;
}

export interface IVerifyCheckoutPaymentInput {
  gatewayOrderId: string;
  gatewayProvider: string | null;
  franchisePaymentGatewayId: number | null;
  paymentId: string;
  signature: string;
  requestedIp: string;
}

export interface IVerifyCheckoutPaymentResult {
  /** The signature and gateway API both confirm a captured payment for this order. */
  captured: boolean;
  gatewayStatus?: string;
  message?: string;
  confirmation?: IGatewayConfirmationResult;
}

/** Gateways whose server-side confirmation is implemented (Telr/Stripe: Phase 8). */
const CHECKOUT_GATEWAYS: ReadonlySet<string> = new Set([PaymentGatewayEnum.RAZORPAY]);

/**
 * Gateway work shared by public plan and product checkout: server-side promo pricing,
 * creating the gateway order for a stored total, and verifying a payment with the
 * gateway before handing it to PaymentConfirmationService.
 */
@Injectable()
export class CheckoutGatewayService {
  private readonly logger = new Logger(CheckoutGatewayService.name);

  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly paymentGatewayResolverService: PaymentGatewayResolverService,
    private readonly paymentGatewayCredentialService: PaymentGatewayCredentialService,
    private readonly paymentGatewayFactory: PaymentGatewayFactory,
    private readonly promoCodeService: PromoCodeService,
    private readonly paymentConfirmationService: PaymentConfirmationService,
  ) {}

  /** Validates the code for this order amount; an invalid code is a 400 with the service's message. */
  public async applyPromoCode(
    promoCode: string | undefined | null,
    orderAmount: number,
    currency: string,
  ): Promise<IAppliedPromo> {
    const code = (promoCode || '').trim();
    if (!code) {
      return { promoCode: null, discountAmount: 0 };
    }
    const result = await this.promoCodeService.applyPromoCode({ code, orderAmount });
    if (!result.valid) {
      throw new BadRequestException(result.message || 'Invalid promo code');
    }
    const discount = Math.min(Number(result.discountAmount) || 0, orderAmount);
    return {
      promoCode: code.toUpperCase(),
      discountAmount: CurrencyUtil.fromMinor(CurrencyUtil.toMinor(discount, currency), currency),
      message: result.message,
    };
  }

  /** Creates the gateway order for exactly `amount` and returns the checkout payload. */
  public async createGatewayOrder(input: ICreateCheckoutGatewayOrderInput): Promise<ICheckoutGatewayOrder> {
    if (!(input.amount > 0)) {
      throw new BadRequestException('Order total must be greater than zero');
    }
    let resolved;
    try {
      resolved = await this.paymentGatewayResolverService.resolve({
        franchiseId: input.franchiseId,
        currency: input.currency,
        isInternational: false,
        amount: input.amount,
      });
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Failed to resolve payment gateway');
    }
    if (input.requestedGatewayId && resolved.franchisePaymentGatewayId !== input.requestedGatewayId) {
      throw new BadRequestException('Selected payment gateway is not available for the given criteria');
    }
    if (!CHECKOUT_GATEWAYS.has(resolved.gatewayCode)) {
      throw new BadRequestException(`Online checkout is not available for ${resolved.gatewayCode} yet`);
    }
    const { keyId, keySecret } = await this.getCredentials(resolved.franchisePaymentGatewayId);
    const notes = {
      ...input.notes,
      franchisePaymentGatewayId: resolved.franchisePaymentGatewayId.toString(),
    };
    const adaptor = this.paymentGatewayFactory.getAdapter(resolved.gatewayCode);
    if (!adaptor.createOrder) {
      throw new BadRequestException(`${resolved.gatewayCode} does not support orders`);
    }
    const order = await adaptor.createOrder(input.amount, input.receipt, input.currency, notes, {
      keyId,
      keySecret,
    });
    return {
      gatewayCode: resolved.gatewayCode as PaymentGatewayEnum,
      gatewayOrderId: order.id,
      keyId,
      amount: input.amount,
      amountMinor: CurrencyUtil.toMinor(input.amount, input.currency),
      currency: input.currency,
      customer: input.customer,
      notes,
      franchisePaymentGatewayId: resolved.franchisePaymentGatewayId,
    };
  }

  /**
   * Checks the checkout signature with the record's own gateway credentials, fetches the
   * payment from the gateway API, and confirms it only when it is captured for this order.
   */
  public async verifyAndConfirm(input: IVerifyCheckoutPaymentInput): Promise<IVerifyCheckoutPaymentResult> {
    if (!input.franchisePaymentGatewayId) {
      throw new BadRequestException('This order was not created by online checkout');
    }
    const gatewayCode = input.gatewayProvider || PaymentGatewayEnum.RAZORPAY;
    const adaptor = this.paymentGatewayFactory.getAdapter(gatewayCode);
    if (!adaptor.verifyPayment || !adaptor.fetchPayment) {
      throw new BadRequestException(`Payment verification not supported for gateway: ${gatewayCode}`);
    }
    const credentials = await this.getCredentials(input.franchisePaymentGatewayId);
    const signature = await adaptor.verifyPayment(
      input.paymentId,
      input.gatewayOrderId,
      input.signature,
      credentials,
    );
    if (!signature.verified) {
      this.logger.warn('Checkout payment signature rejected', { gatewayOrderId: input.gatewayOrderId });
      return { captured: false, message: 'Payment signature is not valid' };
    }
    let payment;
    try {
      payment = await adaptor.fetchPayment(input.paymentId, credentials);
    } catch (error) {
      this.logger.warn('Could not fetch checkout payment from the gateway', {
        gatewayOrderId: input.gatewayOrderId,
        error: error instanceof Error ? error.message : String(error),
      });
      return { captured: false, message: 'Payment could not be confirmed with the gateway yet' };
    }
    if (payment.orderId !== input.gatewayOrderId) {
      return { captured: false, gatewayStatus: payment.status, message: 'Payment does not belong to this order' };
    }
    if (payment.status !== 'captured') {
      return { captured: false, gatewayStatus: payment.status, message: 'Payment is not captured yet' };
    }
    const confirmation = await this.paymentConfirmationService.confirmGatewayPayment({
      provider: gatewayCode,
      gatewayOrderId: input.gatewayOrderId,
      gatewayPaymentId: payment.id,
      capturedAt: payment.createdAt,
      amountMinor: payment.amountMinor,
      currency: payment.currency,
      gatewayResponse: payment.raw,
      requestedIp: input.requestedIp,
    });
    return { captured: true, gatewayStatus: payment.status, message: confirmation.message, confirmation };
  }

  private async getCredentials(franchisePaymentGatewayId: number): Promise<{ keyId: string; keySecret: string }> {
    const credentialMode = this.appConfigService.getString(ConfigParam.PAYMENT_MODE);
    const credentials = await this.paymentGatewayCredentialService.getActiveCredentials(
      franchisePaymentGatewayId,
      credentialMode,
    );
    if (!credentials) {
      throw new BadRequestException(
        `Payment gateway credentials not found for gateway ID: ${franchisePaymentGatewayId} in mode: ${credentialMode}`,
      );
    }
    return { keyId: credentials.apiKeyEncrypted, keySecret: credentials.apiSecretEncrypted };
  }
}
