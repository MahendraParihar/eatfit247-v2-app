import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UniqueConstraintError } from 'sequelize';
import {
  CurrencyUtil,
  GatewayEventResultEnum,
  PaymentGatewayEnum,
  RazorpayWebhookPayload,
} from '@eatfit247-shared-lib';
import { TxnPaymentGatewayEvent } from '../models';
import {
  IGatewayConfirmationResult,
  PaymentConfirmationService,
} from './payment-confirmation.service';

export interface IRazorpayWebhookResult {
  status: 'success' | 'duplicate';
  result: GatewayEventResultEnum;
  message?: string;
}

interface IRazorpayEventFacts {
  gatewayOrderId: string | null;
  gatewayPaymentId: string | null;
  amountMinor: number | null;
  currency: string | null;
  occurredAt: Date;
}

interface IEventOutcome {
  result: GatewayEventResultEnum;
  message?: string;
  memberPaymentId?: number | null;
  memberProductId?: number | null;
  promoOverLimit?: boolean;
}

const CONFIRM_EVENTS = new Set(['payment.captured', 'order.paid', 'payment_link.paid']);
const LOG_ONLY_EVENTS = new Set([
  'payment_link.partially_paid',
  'payment_link.cancelled',
  'payment_link.expired',
]);
const REFUND_EVENTS = new Set(['payment.refunded', 'refund.created']);

/** A NULL-result row younger than this is still being processed by another delivery. */
const IN_FLIGHT_MS = 5 * 60 * 1000;

/** Results after which a redelivered event is not processed again. */
const FINAL_RESULTS: ReadonlySet<string> = new Set([
  GatewayEventResultEnum.APPLIED,
  GatewayEventResultEnum.IGNORED_STATE,
  GatewayEventResultEnum.ORDER_NOT_FOUND,
]);

/**
 * Handles a signature-verified Razorpay webhook: log the event (idempotent by event id),
 * route it, and record the outcome. State changes go through PaymentConfirmationService.
 */
@Injectable()
export class RazorpayWebhookService {
  private readonly logger = new Logger(RazorpayWebhookService.name);

  constructor(
    @InjectModel(TxnPaymentGatewayEvent)
    private readonly gatewayEventRepository: typeof TxnPaymentGatewayEvent,
    private readonly paymentConfirmationService: PaymentConfirmationService,
  ) {}

  public async handleVerifiedEvent(
    eventId: string,
    payload: RazorpayWebhookPayload,
    requestedIp: string,
  ): Promise<IRazorpayWebhookResult> {
    const facts = this.extractFacts(payload);
    const eventRow = await this.recordEvent(eventId, payload, facts, requestedIp);
    if (!eventRow) {
      this.logger.log(`Duplicate webhook event ${eventId} (${payload.event}) ignored`);
      return { status: 'duplicate', result: GatewayEventResultEnum.IGNORED_DUPLICATE };
    }

    let outcome: IEventOutcome;
    try {
      outcome = await this.route(payload, facts, requestedIp);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await eventRow.update({
        result: GatewayEventResultEnum.ERROR,
        message,
        modifiedIp: requestedIp,
      });
      throw error;
    }

    await eventRow.update({
      result: outcome.result,
      message: outcome.message ?? null,
      memberPaymentId: outcome.memberPaymentId ?? null,
      memberProductId: outcome.memberProductId ?? null,
      promoOverLimit: !!outcome.promoOverLimit,
      modifiedIp: requestedIp,
    });
    this.logger.log(`Webhook event ${eventId} (${payload.event}) → ${outcome.result}`, {
      gatewayOrderId: facts.gatewayOrderId,
      message: outcome.message,
    });
    return { status: 'success', result: outcome.result, message: outcome.message };
  }

  /**
   * Insert the event first. A redelivery of an event that already reached a final result
   * returns null; one that errored or never finished is processed again on the same row.
   */
  private async recordEvent(
    eventId: string,
    payload: RazorpayWebhookPayload,
    facts: IRazorpayEventFacts,
    requestedIp: string,
  ): Promise<TxnPaymentGatewayEvent | null> {
    const provider = PaymentGatewayEnum.RAZORPAY;
    try {
      return await this.gatewayEventRepository.create({
        provider,
        eventId,
        eventType: payload.event,
        gatewayOrderId: facts.gatewayOrderId,
        gatewayPaymentId: facts.gatewayPaymentId,
        amount:
          facts.amountMinor !== null && facts.currency
            ? CurrencyUtil.fromMinor(facts.amountMinor, facts.currency)
            : null,
        currency: facts.currency ? facts.currency.toUpperCase() : null,
        signatureValid: true,
        payload: payload as unknown as Record<string, unknown>,
        receivedAt: new Date(),
        createdIp: requestedIp,
        modifiedIp: requestedIp,
      } as TxnPaymentGatewayEvent);
    } catch (error) {
      if (!(error instanceof UniqueConstraintError)) {
        throw error;
      }
      const existing = await this.gatewayEventRepository.findOne({ where: { provider, eventId } });
      if (!existing || (existing.result && FINAL_RESULTS.has(existing.result))) {
        return null;
      }
      const inFlight =
        existing.result === null && Date.now() - new Date(existing.createdAt).getTime() < IN_FLIGHT_MS;
      if (inFlight) {
        return null;
      }
      return existing;
    }
  }

  private async route(
    payload: RazorpayWebhookPayload,
    facts: IRazorpayEventFacts,
    requestedIp: string,
  ): Promise<IEventOutcome> {
    const event = payload.event;
    if (!facts.gatewayOrderId) {
      return {
        result: GatewayEventResultEnum.ORDER_NOT_FOUND,
        message: `No gateway order or payment link id in ${event}`,
      };
    }

    // Payment-link payments also fire payment.captured / order.paid against an order id
    // Razorpay creates internally; the link's own payment_link.* event carries the record.
    if (payload.payload.payment_link?.entity?.id && !event.startsWith('payment_link.')) {
      return {
        result: GatewayEventResultEnum.IGNORED_STATE,
        message: 'Payment-link payment; handled by payment_link.* events',
      };
    }

    if (CONFIRM_EVENTS.has(event)) {
      if (facts.amountMinor === null || !facts.currency) {
        return { result: GatewayEventResultEnum.ERROR, message: `No amount or currency in ${event}` };
      }
      const confirmation = await this.paymentConfirmationService.confirmGatewayPayment({
        provider: PaymentGatewayEnum.RAZORPAY,
        gatewayOrderId: facts.gatewayOrderId,
        gatewayPaymentId: facts.gatewayPaymentId,
        capturedAt: facts.occurredAt,
        amountMinor: facts.amountMinor,
        currency: facts.currency,
        gatewayResponse: payload.payload.payment?.entity ?? payload.payload.payment_link?.entity ?? null,
        requestedIp,
      });
      return this.toOutcome(confirmation);
    }

    if (event === 'payment.failed') {
      const failure = await this.paymentConfirmationService.markGatewayPaymentFailed({
        gatewayOrderId: facts.gatewayOrderId,
        gatewayPaymentId: facts.gatewayPaymentId,
        gatewayResponse: payload.payload.payment?.entity ?? null,
        requestedIp,
      });
      return this.toOutcome(failure);
    }

    if (REFUND_EVENTS.has(event)) {
      const payment = payload.payload.payment?.entity;
      if (!payment) {
        return { result: GatewayEventResultEnum.ERROR, message: `No payment entity in ${event}` };
      }
      const refund = await this.paymentConfirmationService.recordGatewayRefund({
        gatewayOrderId: facts.gatewayOrderId,
        refundStatus: payment.refund_status,
        amountRefundedMinor: payment.amount_refunded || 0,
        currency: payment.currency,
        requestedIp,
      });
      return this.toOutcome(refund);
    }

    // Partial payment, cancelled and expired links are evidence only (decisions 7 and 10).
    const ref = await this.paymentConfirmationService.findRecordRef(facts.gatewayOrderId);
    return {
      result: ref ? GatewayEventResultEnum.IGNORED_STATE : GatewayEventResultEnum.ORDER_NOT_FOUND,
      message: LOG_ONLY_EVENTS.has(event) ? 'Logged only; status unchanged' : `Unhandled event type ${event}`,
      memberPaymentId: ref?.memberPaymentId ?? null,
      memberProductId: ref?.memberProductId ?? null,
    };
  }

  private toOutcome(confirmation: IGatewayConfirmationResult): IEventOutcome {
    return {
      result: confirmation.result,
      message: confirmation.message,
      memberPaymentId: confirmation.memberPaymentId,
      memberProductId: confirmation.memberProductId,
      promoOverLimit: confirmation.promoOverLimit,
    };
  }

  /** Order or link id, payment id, and amount (minor units) the event refers to. */
  private extractFacts(payload: RazorpayWebhookPayload): IRazorpayEventFacts {
    const payment = payload.payload.payment?.entity;
    const link = payload.payload.payment_link?.entity;
    const order = payload.payload.order?.entity;
    const toDate = (epochSeconds?: number | null): Date | null =>
      epochSeconds ? new Date(epochSeconds * 1000) : null;

    if (payload.event.startsWith('payment_link.') && link) {
      return {
        gatewayOrderId: link.id,
        gatewayPaymentId: payment?.id ?? null,
        amountMinor: link.amount_paid ?? payment?.amount ?? null,
        currency: link.currency ?? payment?.currency ?? null,
        occurredAt: toDate(payment?.created_at) ?? toDate(link.updated_at) ?? new Date(),
      };
    }
    if (payment) {
      return {
        gatewayOrderId: payment.order_id ?? order?.id ?? null,
        gatewayPaymentId: payment.id,
        amountMinor: payment.amount ?? null,
        currency: payment.currency ?? null,
        occurredAt: toDate(payment.created_at) ?? new Date(),
      };
    }
    if (order) {
      return {
        gatewayOrderId: order.id,
        gatewayPaymentId: null,
        amountMinor: order.amount_paid ?? null,
        currency: order.currency ?? null,
        occurredAt: toDate(order.updated_at) ?? toDate(order.created_at) ?? new Date(),
      };
    }
    return {
      gatewayOrderId: null,
      gatewayPaymentId: null,
      amountMinor: null,
      currency: null,
      occurredAt: new Date(),
    };
  }
}
