import { BadRequestException, ConflictException, HttpException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction, UniqueConstraintError } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
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
import { TxnPaymentGatewayEvent } from '../models';

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

export interface ICheckoutPaymentLink {
  gatewayCode: PaymentGatewayEnum;
  paymentLinkId: string;
  shortUrl: string;
  franchisePaymentGatewayId: number;
}

/** A resolved gateway and its credentials, prepared before any row lock is taken. */
export interface IGatewayContext {
  franchisePaymentGatewayId: number;
  gatewayCode: string;
  credentials: { keyId: string; keySecret: string };
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

/**
 * Promo codes have no currency yet: FLAT values and min/max amounts are rupees.
 * Until txn_promo_codes gets a currency, codes are only accepted for INR payments.
 */
const PROMO_CODE_CURRENCY = 'INR';

/** How long an admin link action waits for a row another request is updating. */
const ADMIN_LOCK_TIMEOUT = '5s';

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
    @InjectModel(TxnPaymentGatewayEvent)
    private readonly gatewayEventRepository: typeof TxnPaymentGatewayEvent,
    private readonly sequelize: Sequelize,
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
    if ((currency || '').toUpperCase() !== PROMO_CODE_CURRENCY) {
      throw new BadRequestException(`Promo codes can only be used for ${PROMO_CODE_CURRENCY} payments`);
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
    const resolved = await this.resolveGateway(input.franchiseId, input.currency, input.amount, input.requestedGatewayId);
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
    await this.logVerifyConfirmation(gatewayCode, payment, confirmation, input.requestedIp);
    return { captured: true, gatewayStatus: payment.status, message: confirmation.message, confirmation };
  }

  /**
   * Verify usually beats the webhook, so its outcome (incl. an over-limit promo) is logged
   * in the gateway event log too, once per payment (`verify:<paymentId>`).
   */
  private async logVerifyConfirmation(
    provider: string,
    payment: { id: string; orderId: string | null; amountMinor: number; currency: string; raw: Record<string, unknown> },
    confirmation: IGatewayConfirmationResult,
    requestedIp: string,
  ): Promise<void> {
    try {
      await this.gatewayEventRepository.create({
        provider,
        eventId: `verify:${payment.id}`,
        eventType: 'checkout.verify',
        gatewayOrderId: payment.orderId,
        gatewayPaymentId: payment.id,
        amount: CurrencyUtil.fromMinor(payment.amountMinor, payment.currency),
        currency: payment.currency.toUpperCase(),
        signatureValid: true,
        payload: payment.raw,
        result: confirmation.result,
        message: confirmation.message ?? null,
        promoOverLimit: confirmation.promoOverLimit,
        memberPaymentId: confirmation.memberPaymentId,
        memberProductId: confirmation.memberProductId,
        receivedAt: new Date(),
        createdIp: requestedIp,
        modifiedIp: requestedIp,
      } as Partial<TxnPaymentGatewayEvent> as TxnPaymentGatewayEvent);
    } catch (error) {
      // A repeated verify for the same payment is already logged
      if (!(error instanceof UniqueConstraintError)) {
        this.logger.error('Could not log checkout verification', {
          gatewayPaymentId: payment.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  /**
   * Gateway + credentials for a link operation (database reads only). Callers that hold a row
   * lock prepare this first, so the locked transaction needs no other pool connection.
   * With a stored gateway (`franchisePaymentGatewayId`) that gateway is used; otherwise it is
   * resolved for the franchise and currency (records from before 4.5 have none stored).
   */
  public async prepareGateway(input: {
    franchiseId: number;
    currency: string;
    amount: number;
    requestedGatewayId?: number;
    franchisePaymentGatewayId?: number | null;
    gatewayProvider?: string | null;
  }): Promise<IGatewayContext> {
    if (input.franchisePaymentGatewayId) {
      return {
        franchisePaymentGatewayId: input.franchisePaymentGatewayId,
        gatewayCode: input.gatewayProvider || PaymentGatewayEnum.RAZORPAY,
        credentials: await this.getCredentials(input.franchisePaymentGatewayId),
      };
    }
    const resolved = await this.resolveGateway(input.franchiseId, input.currency, input.amount, input.requestedGatewayId);
    return {
      franchisePaymentGatewayId: resolved.franchisePaymentGatewayId,
      gatewayCode: resolved.gatewayCode,
      credentials: await this.getCredentials(resolved.franchisePaymentGatewayId),
    };
  }

  /** Create a payment link with a prepared gateway (gateway API call only, no database). */
  public async createLinkWith(
    context: IGatewayContext,
    input: Pick<ICreateCheckoutGatewayOrderInput, 'currency' | 'amount' | 'description' | 'customer' | 'notes'>,
  ): Promise<ICheckoutPaymentLink> {
    const notes = { ...input.notes, franchisePaymentGatewayId: context.franchisePaymentGatewayId.toString() };
    const adaptor = this.paymentGatewayFactory.getAdapter(context.gatewayCode);
    let link: { id: string; short_url: string };
    try {
      link = await adaptor.createPaymentLink(input.amount, input.currency, input.description, input.customer, notes, context.credentials);
    } catch (error) {
      throw this.toGatewayError(error, 'The payment link could not be created');
    }
    return {
      gatewayCode: context.gatewayCode as PaymentGatewayEnum,
      paymentLinkId: link.id,
      shortUrl: link.short_url,
      franchisePaymentGatewayId: context.franchisePaymentGatewayId,
    };
  }

  /**
   * Cancel a payment link with a prepared gateway (gateway API call only). cancelled=false
   * means it had already been paid.
   */
  public async cancelLinkWith(context: IGatewayContext, paymentLinkId: string): Promise<{ cancelled: boolean; status: string }> {
    const adaptor = this.paymentGatewayFactory.getAdapter(context.gatewayCode);
    if (!adaptor.cancelPaymentLink) {
      throw new BadRequestException(`Cancelling payment links is not supported for ${context.gatewayCode}`);
    }
    try {
      const { status } = await adaptor.cancelPaymentLink(paymentLinkId, context.credentials);
      return { cancelled: status !== 'paid', status };
    } catch (error) {
      throw this.toGatewayError(error, `The payment link ${paymentLinkId} could not be cancelled`);
    }
  }

  /** Admin create (decision 13): link for exactly the record's stored total. */
  public async createGatewayPaymentLink(input: ICreateCheckoutGatewayOrderInput): Promise<ICheckoutPaymentLink> {
    const context = await this.prepareGateway({
      franchiseId: input.franchiseId,
      currency: input.currency,
      amount: input.amount,
      requestedGatewayId: input.requestedGatewayId,
    });
    return this.createLinkWith(context, input);
  }

  /** Cancel a link that is not row-locked by the caller (e.g. cleanup after a failed save). */
  public async cancelGatewayPaymentLink(input: {
    paymentLinkId: string;
    gatewayProvider: string | null;
    franchisePaymentGatewayId: number | null;
    fallback?: { franchiseId: number; currency: string; amount: number };
  }): Promise<{ cancelled: boolean; status: string }> {
    if (!input.franchisePaymentGatewayId && !input.fallback) {
      throw new BadRequestException('This payment has no gateway to cancel the link with');
    }
    const context = await this.prepareGateway({
      franchiseId: input.fallback?.franchiseId ?? 0,
      currency: input.fallback?.currency ?? '',
      amount: input.fallback?.amount ?? 0,
      franchisePaymentGatewayId: input.franchisePaymentGatewayId,
      gatewayProvider: input.gatewayProvider,
    });
    return this.cancelLinkWith(context, input.paymentLinkId);
  }

  /**
   * Admin link actions lock the row only briefly: a second admin on the same payment gets a
   * quick 409 instead of waiting (Postgres `lock_timeout`, local to the transaction).
   */
  public async setAdminLockTimeout(transaction: Transaction): Promise<void> {
    await this.sequelize.query(`SET LOCAL lock_timeout = '${ADMIN_LOCK_TIMEOUT}'`, { transaction });
  }

  /** Postgres lock_not_available (55P03) → 409, any other error unchanged. */
  public mapLockTimeout(error: unknown): unknown {
    const code = (error as { original?: { code?: string }; parent?: { code?: string } } | null)?.original?.code
      ?? (error as { parent?: { code?: string } } | null)?.parent?.code;
    return code === '55P03' ? new ConflictException('This payment is being updated by another request; please try again.') : error;
  }

  /** Validates that a link can be created (regenerate checks this before cancelling the old one). */
  public async assertGatewayAvailable(
    franchiseId: number,
    currency: string,
    amount: number,
    requestedGatewayId?: number,
  ): Promise<void> {
    await this.resolveGateway(franchiseId, currency, amount, requestedGatewayId);
  }

  /** Razorpay payment links start with `plink_`; website checkout orders (`order_…`) have none. */
  public isPaymentLink(gatewayOrderId: string | null): boolean {
    return !!gatewayOrderId && gatewayOrderId.startsWith('plink_');
  }

  /** Gateway SDK rejections are plain objects (not Errors); surface them as 400/409, not 500. */
  private toGatewayError(error: unknown, fallbackMessage: string): HttpException {
    if (error instanceof HttpException) {
      return error;
    }
    const gatewayError = error as { error?: { description?: string }; message?: string } | null;
    const message = gatewayError?.error?.description || gatewayError?.message || fallbackMessage;
    this.logger.warn(`Gateway error: ${message}`);
    return /already (been )?paid|has been paid|link is paid/i.test(message)
      ? new ConflictException(message)
      : new BadRequestException(message);
  }

  /** Admin links are Razorpay payment links (`plink_…`); website orders (`order_…`) have none. */
  public requirePaymentLinkId(gatewayOrderId: string | null): string {
    if (!this.isPaymentLink(gatewayOrderId)) {
      throw new BadRequestException('This payment has no payment link');
    }
    return gatewayOrderId as string;
  }

  private async resolveGateway(
    franchiseId: number,
    currency: string,
    amount: number,
    requestedGatewayId?: number,
  ): Promise<{ franchisePaymentGatewayId: number; gatewayCode: string }> {
    if (!(amount > 0)) {
      throw new BadRequestException('Order total must be greater than zero');
    }
    let resolved;
    try {
      resolved = await this.paymentGatewayResolverService.resolve({
        franchiseId,
        currency,
        isInternational: false,
        amount,
      });
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Failed to resolve payment gateway');
    }
    if (requestedGatewayId && resolved.franchisePaymentGatewayId !== requestedGatewayId) {
      throw new BadRequestException('Selected payment gateway is not available for the given criteria');
    }
    if (!CHECKOUT_GATEWAYS.has(resolved.gatewayCode)) {
      throw new BadRequestException(`Online checkout is not available for ${resolved.gatewayCode} yet`);
    }
    return resolved;
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
