import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Sequelize } from 'sequelize-typescript';
import { Transaction } from 'sequelize';
import { FranchiseDateUtil } from '@server_1/platform';
import { PromoCodeService } from '@server_1/modules/promo-code';
import {
  CurrencyUtil,
  GatewayEventResultEnum,
  PaymentStatusEnum,
} from '@eatfit247-shared-lib';
import { TxnMemberPayment, TxnMemberProduct } from '../models';
import { InvoiceIssueService } from './invoice-issue.service';

export type GatewayRecordType = 'plan' | 'product';

export interface IConfirmGatewayPaymentInput {
  provider: string;
  gatewayOrderId: string;
  gatewayPaymentId: string | null;
  capturedAt: Date;
  /** Amount the gateway captured, in its minor units. */
  amountMinor: number;
  currency: string;
  gatewayResponse?: object | null;
  requestedIp: string;
}

export interface IMarkGatewayPaymentFailedInput {
  gatewayOrderId: string;
  gatewayPaymentId: string | null;
  gatewayResponse?: object | null;
  requestedIp: string;
}

export interface IGatewayRefundInput {
  gatewayOrderId: string;
  refundStatus: string | null;
  /** Total refunded so far, in the gateway's minor units. */
  amountRefundedMinor: number;
  currency: string;
  requestedIp: string;
}

export interface IGatewayRecordRef {
  recordType: GatewayRecordType;
  memberPaymentId: number | null;
  memberProductId: number | null;
}

export interface IGatewayConfirmationResult {
  result: GatewayEventResultEnum;
  message?: string;
  recordType: GatewayRecordType | null;
  memberPaymentId: number | null;
  memberProductId: number | null;
  paymentStatusId: PaymentStatusEnum | null;
  invoiceId: string | null;
  promoOverLimit: boolean;
}

type GatewayRecord = TxnMemberPayment | TxnMemberProduct;

interface ILockedRecord {
  recordType: GatewayRecordType;
  record: GatewayRecord;
}

/** How long a webhook/verify confirmation waits for a row lock before failing (and retrying). */
const GATEWAY_LOCK_TIMEOUT = '10s';

/** Statuses a gateway confirmation may move to PAID (decision 6). */
const CONFIRMABLE_STATUSES: ReadonlySet<PaymentStatusEnum> = new Set([
  PaymentStatusEnum.PENDING,
  PaymentStatusEnum.FAILED,
]);

/**
 * The only place a gateway payment moves a plan or product record to PAID (principle 11).
 * Used by the verified webhook and by the public verify-payment call; whichever arrives
 * second finds the record PAID under the row lock and does nothing.
 */
@Injectable()
export class PaymentConfirmationService {
  private readonly logger = new Logger(PaymentConfirmationService.name);

  constructor(
    @InjectModel(TxnMemberPayment)
    private readonly memberPaymentRepository: typeof TxnMemberPayment,
    @InjectModel(TxnMemberProduct)
    private readonly memberProductRepository: typeof TxnMemberProduct,
    private readonly sequelize: Sequelize,
    private readonly invoiceIssueService: InvoiceIssueService,
    private readonly promoCodeService: PromoCodeService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * PENDING/FAILED → PAID once the gateway has captured the stored total.
   * In one transaction: lock the record, check state, amount and currency, set PAID,
   * issue the invoice number, count the promo use. Emits the paid event after commit.
   */
  public async confirmGatewayPayment(
    input: IConfirmGatewayPaymentInput,
  ): Promise<IGatewayConfirmationResult> {
    const transaction = await this.sequelize.transaction();
    let outcome: IGatewayConfirmationResult;
    try {
      const locked = await this.lockRecordByGatewayOrderId(input.gatewayOrderId, transaction);
      if ('result' in locked) {
        await transaction.rollback();
        return locked;
      }
      const { recordType, record } = locked;
      const base = this.baseResult(recordType, record);

      if (!CONFIRMABLE_STATUSES.has(record.paymentStatusId)) {
        await transaction.rollback();
        return {
          ...base,
          result: GatewayEventResultEnum.IGNORED_STATE,
          message: `Record is in status ${record.paymentStatusId}; confirmation ignored`,
        };
      }

      const mismatch = this.findAmountMismatch(record, input.amountMinor, input.currency);
      if (mismatch) {
        await transaction.rollback();
        this.logger.error('Gateway amount/currency mismatch; record not marked PAID', {
          gatewayOrderId: input.gatewayOrderId,
          recordType,
          mismatch,
        });
        return { ...base, result: GatewayEventResultEnum.ERROR, message: mismatch };
      }

      record.paymentStatusId = PaymentStatusEnum.PAID;
      const franchiseContext = record.franchiseId
        ? await this.invoiceIssueService.franchiseContext(record.franchiseId)
        : undefined;
      record.paymentDate =
        recordType === 'plan' && franchiseContext
          ? // Plan payment_date is a calendar date: use the capture day in the franchise's timezone
            FranchiseDateUtil.calendarDate(FranchiseDateUtil.localDate(input.capturedAt, franchiseContext.timeZone))
          : input.capturedAt;
      record.gatewayPaymentId = input.gatewayPaymentId as string;
      record.transactionId = input.gatewayPaymentId as string;
      if (input.gatewayResponse) {
        record.paymentGatewayResponse = input.gatewayResponse;
      }
      record.modifiedIp = input.requestedIp;
      await record.save({ transaction });

      if (!record.invoiceId && record.franchiseId) {
        // Dated when issued (decision 12), which can be after the capture day if the
        // gateway confirms late; payment_date keeps the capture day
        await this.invoiceIssueService.issue(
          record,
          recordType,
          record.franchiseId,
          transaction,
          new Date(),
          franchiseContext,
        );
        await record.save({ transaction });
      }

      let promoOverLimit = false;
      if (record.promoCode) {
        const usage = await this.promoCodeService.recordUsage(record.promoCode, transaction);
        promoOverLimit = !!usage?.overLimit;
        if (promoOverLimit) {
          this.logger.warn('Promo code used past its usage limit on a paid order', {
            promoCode: record.promoCode,
            gatewayOrderId: input.gatewayOrderId,
          });
        }
      }

      await transaction.commit();
      outcome = {
        ...this.baseResult(recordType, record),
        result: GatewayEventResultEnum.APPLIED,
        promoOverLimit,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    this.emitPaid(outcome, input.requestedIp);
    return outcome;
  }

  /** PENDING → FAILED only. A late failure never touches a PAID, FAILED or refunded record. */
  public async markGatewayPaymentFailed(
    input: IMarkGatewayPaymentFailedInput,
  ): Promise<IGatewayConfirmationResult> {
    const transaction = await this.sequelize.transaction();
    try {
      const locked = await this.lockRecordByGatewayOrderId(input.gatewayOrderId, transaction);
      if ('result' in locked) {
        await transaction.rollback();
        return locked;
      }
      const { recordType, record } = locked;
      if (record.paymentStatusId !== PaymentStatusEnum.PENDING) {
        await transaction.rollback();
        return {
          ...this.baseResult(recordType, record),
          result: GatewayEventResultEnum.IGNORED_STATE,
          message: `Record is in status ${record.paymentStatusId}; failure ignored`,
        };
      }
      record.paymentStatusId = PaymentStatusEnum.FAILED;
      if (input.gatewayPaymentId) {
        record.gatewayPaymentId = input.gatewayPaymentId;
      }
      if (input.gatewayResponse) {
        record.paymentGatewayResponse = input.gatewayResponse;
      }
      record.modifiedIp = input.requestedIp;
      await record.save({ transaction });
      await transaction.commit();
      return { ...this.baseResult(recordType, record), result: GatewayEventResultEnum.APPLIED };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /** Store the refund snapshot as today; status and tax changes are left to 4.9. */
  public async recordGatewayRefund(input: IGatewayRefundInput): Promise<IGatewayConfirmationResult> {
    const transaction = await this.sequelize.transaction();
    try {
      const locked = await this.lockRecordByGatewayOrderId(input.gatewayOrderId, transaction);
      if ('result' in locked) {
        await transaction.rollback();
        return locked;
      }
      const { recordType, record } = locked;
      const amountRefunded = CurrencyUtil.fromMinor(input.amountRefundedMinor, input.currency);
      const storedRefunded = Number((record.refundObj as { amountRefunded?: number } | null)?.amountRefunded ?? 0);
      // Refunds only grow; an older event (e.g. a replayed body) must not overwrite a later one.
      if (amountRefunded < storedRefunded) {
        await transaction.rollback();
        return {
          ...this.baseResult(recordType, record),
          result: GatewayEventResultEnum.IGNORED_STATE,
          message: `Refund ${amountRefunded} is below the stored ${storedRefunded}; ignored`,
        };
      }
      record.refundObj = {
        refundStatus: input.refundStatus,
        amountRefunded,
        refundedAt: new Date(),
      };
      record.modifiedIp = input.requestedIp;
      await record.save({ transaction });
      await transaction.commit();
      return {
        ...this.baseResult(recordType, record),
        result: GatewayEventResultEnum.APPLIED,
        message: 'Refund details stored; status unchanged',
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /** The gateway stored on the record with this gateway order or link id (webhook secret fallback). */
  public async findStoredGatewayId(gatewayOrderId: string): Promise<number | null> {
    const payment = await this.memberPaymentRepository.findOne({
      attributes: ['franchisePaymentGatewayId'],
      where: { gatewayOrderId },
    });
    if (payment?.franchisePaymentGatewayId) {
      return payment.franchisePaymentGatewayId;
    }
    const product = await this.memberProductRepository.findOne({
      attributes: ['franchisePaymentGatewayId'],
      where: { gatewayOrderId },
    });
    return product?.franchisePaymentGatewayId ?? null;
  }

  /** Existing record ids among those named in a verified event's notes (for linking evidence). */
  public async findExistingRecordIds(ids: {
    memberPaymentId: number | null;
    memberProductId: number | null;
  }): Promise<{ memberPaymentId: number | null; memberProductId: number | null }> {
    const [payment, product] = await Promise.all([
      ids.memberPaymentId ? this.memberPaymentRepository.findByPk(ids.memberPaymentId, { attributes: ['memberPaymentId'] }) : null,
      ids.memberProductId ? this.memberProductRepository.findByPk(ids.memberProductId, { attributes: ['memberProductId'] }) : null,
    ]);
    return { memberPaymentId: payment?.memberPaymentId ?? null, memberProductId: product?.memberProductId ?? null };
  }

  /** Read-only lookup used to link log-only events to their record. */
  public async findRecordRef(gatewayOrderId: string): Promise<IGatewayRecordRef | null> {
    const payment = await this.memberPaymentRepository.findOne({
      attributes: ['memberPaymentId'],
      where: { gatewayOrderId, active: true },
    });
    if (payment) {
      return { recordType: 'plan', memberPaymentId: payment.memberPaymentId, memberProductId: null };
    }
    const product = await this.memberProductRepository.findOne({
      attributes: ['memberProductId'],
      where: { gatewayOrderId, active: true },
    });
    if (product) {
      return { recordType: 'product', memberPaymentId: null, memberProductId: product.memberProductId };
    }
    return null;
  }

  private async lockRecordByGatewayOrderId(
    gatewayOrderId: string,
    transaction: Transaction,
  ): Promise<ILockedRecord | IGatewayConfirmationResult> {
    // Don't wait forever behind an admin action on the same row; the gateway retries a 5xx
    await this.sequelize.query(`SET LOCAL lock_timeout = '${GATEWAY_LOCK_TIMEOUT}'`, { transaction });
    const where = { gatewayOrderId, active: true };
    const lock = transaction.LOCK.UPDATE;
    const [payments, products] = await Promise.all([
      this.memberPaymentRepository.findAll({ where, transaction, lock, limit: 2 }),
      this.memberProductRepository.findAll({ where, transaction, lock, limit: 2 }),
    ]);
    const matches: ILockedRecord[] = [
      ...payments.map((record) => ({ recordType: 'plan' as const, record })),
      ...products.map((record) => ({ recordType: 'product' as const, record })),
    ];
    if (matches.length === 1) {
      return matches[0];
    }
    const empty: IGatewayConfirmationResult = {
      result: GatewayEventResultEnum.ORDER_NOT_FOUND,
      recordType: null,
      memberPaymentId: null,
      memberProductId: null,
      paymentStatusId: null,
      invoiceId: null,
      promoOverLimit: false,
    };
    if (matches.length === 0) {
      return { ...empty, message: `No record for gateway order ${gatewayOrderId}` };
    }
    this.logger.error('Gateway order id matches more than one record', { gatewayOrderId });
    return {
      ...empty,
      result: GatewayEventResultEnum.ERROR,
      message: `Gateway order ${gatewayOrderId} matches more than one record`,
    };
  }

  private findAmountMismatch(record: GatewayRecord, amountMinor: number, currency: string): string | null {
    const storedCurrency = (record.currency || '').toUpperCase();
    const gatewayCurrency = (currency || '').toUpperCase();
    if (!storedCurrency || storedCurrency !== gatewayCurrency) {
      return `Currency mismatch: stored ${storedCurrency || 'none'}, gateway ${gatewayCurrency || 'none'}`;
    }
    const expectedMinor = CurrencyUtil.toMinor(Number(record.totalAmount || 0), storedCurrency);
    if (expectedMinor !== amountMinor) {
      return `Amount mismatch: stored ${expectedMinor}, gateway ${amountMinor} (${storedCurrency} minor units)`;
    }
    return null;
  }

  private baseResult(recordType: GatewayRecordType, record: GatewayRecord): IGatewayConfirmationResult {
    return {
      result: GatewayEventResultEnum.APPLIED,
      recordType,
      memberPaymentId: recordType === 'plan' ? (record as TxnMemberPayment).memberPaymentId : null,
      memberProductId: recordType === 'product' ? (record as TxnMemberProduct).memberProductId : null,
      paymentStatusId: record.paymentStatusId,
      invoiceId: record.invoiceId || null,
      promoOverLimit: false,
    };
  }

  private emitPaid(outcome: IGatewayConfirmationResult, requestedIp: string): void {
    if (outcome.recordType === 'product') {
      this.eventEmitter.emit('order.product.paid', {
        memberProductId: outcome.memberProductId,
        createdBy: null,
        createdIp: requestedIp,
      });
    } else if (outcome.recordType === 'plan') {
      this.eventEmitter.emit('order.plan.paid', {
        memberPaymentId: outcome.memberPaymentId,
        createdBy: null,
        createdIp: requestedIp,
      });
    }
  }
}
