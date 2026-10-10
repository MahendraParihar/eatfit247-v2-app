import { EventEmitter2 } from '@nestjs/event-emitter';
import { Sequelize } from 'sequelize-typescript';
import { InvoiceSequenceService } from '@server_1/platform';
import { FranchiseService } from '@server_1/modules/franchise';
import { PromoCodeService } from '@server_1/modules/promo-code';
import { BusinessTypeEnum, GatewayEventResultEnum, PaymentStatusEnum } from '@eatfit247-shared-lib';
import { TxnMemberPayment, TxnMemberProduct } from '../models';
import {
  IConfirmGatewayPaymentInput,
  PaymentConfirmationService,
} from './payment-confirmation.service';

interface IFakeRecord {
  memberPaymentId?: number;
  memberProductId?: number;
  franchiseId: number;
  paymentStatusId: PaymentStatusEnum;
  totalAmount: string;
  currency: string;
  promoCode: string | null;
  invoiceId: string | null;
  paymentDate: Date | null;
  gatewayPaymentId: string | null;
  transactionId: string | null;
  paymentGatewayResponse: object | null;
  refundObj: object | null;
  modifiedIp: string | null;
  save: jest.Mock;
}

const makeRecord = (overrides: Partial<IFakeRecord> = {}): IFakeRecord => ({
  memberPaymentId: 101,
  franchiseId: 1,
  paymentStatusId: PaymentStatusEnum.PENDING,
  totalAmount: '1180.00',
  currency: 'INR',
  promoCode: null,
  invoiceId: null,
  paymentDate: null,
  gatewayPaymentId: null,
  transactionId: null,
  paymentGatewayResponse: null,
  refundObj: null,
  modifiedIp: null,
  save: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

const confirmInput = (overrides: Partial<IConfirmGatewayPaymentInput> = {}): IConfirmGatewayPaymentInput => ({
  provider: 'RAZORPAY',
  gatewayOrderId: 'order_1',
  gatewayPaymentId: 'pay_1',
  capturedAt: new Date('2026-10-10T05:00:00Z'),
  amountMinor: 118000,
  currency: 'INR',
  gatewayResponse: { id: 'pay_1' },
  requestedIp: '127.0.0.1',
  ...overrides,
});

describe('PaymentConfirmationService', () => {
  let service: PaymentConfirmationService;
  let transaction: { LOCK: { UPDATE: string }; commit: jest.Mock; rollback: jest.Mock };
  let paymentFindAll: jest.Mock;
  let productFindAll: jest.Mock;
  let generateInvoiceNumber: jest.Mock;
  let recordUsage: jest.Mock;
  let emit: jest.Mock;
  let invoiceCounter: number;

  /** Both tables return these rows for any gateway order id. */
  const givenRecords = (plan: IFakeRecord[], product: IFakeRecord[] = []): void => {
    paymentFindAll.mockResolvedValue(plan);
    productFindAll.mockResolvedValue(product);
  };

  beforeEach(() => {
    transaction = { LOCK: { UPDATE: 'UPDATE' }, commit: jest.fn(), rollback: jest.fn() };
    paymentFindAll = jest.fn();
    productFindAll = jest.fn();
    invoiceCounter = 0;
    generateInvoiceNumber = jest.fn().mockImplementation(async () => {
      invoiceCounter += 1;
      return `EF/2026-27/S/${String(invoiceCounter).padStart(6, '0')}`;
    });
    recordUsage = jest.fn().mockResolvedValue({ overLimit: false });
    emit = jest.fn();

    service = new PaymentConfirmationService(
      { findAll: paymentFindAll, findOne: jest.fn() } as unknown as typeof TxnMemberPayment,
      { findAll: productFindAll, findOne: jest.fn() } as unknown as typeof TxnMemberProduct,
      { transaction: jest.fn().mockResolvedValue(transaction) } as unknown as Sequelize,
      {
        fetchById: jest.fn().mockResolvedValue({ financialYear: 4, franchiseCode: 'EF' }),
      } as unknown as FranchiseService,
      { generateInvoiceNumber } as unknown as InvoiceSequenceService,
      { recordUsage } as unknown as PromoCodeService,
      { emit } as unknown as EventEmitter2,
    );
  });

  describe('state matrix', () => {
    const confirmCases: Array<[PaymentStatusEnum, GatewayEventResultEnum, PaymentStatusEnum]> = [
      [PaymentStatusEnum.PENDING, GatewayEventResultEnum.APPLIED, PaymentStatusEnum.PAID],
      [PaymentStatusEnum.FAILED, GatewayEventResultEnum.APPLIED, PaymentStatusEnum.PAID],
      [PaymentStatusEnum.PAID, GatewayEventResultEnum.IGNORED_STATE, PaymentStatusEnum.PAID],
      [PaymentStatusEnum.REFUND, GatewayEventResultEnum.IGNORED_STATE, PaymentStatusEnum.REFUND],
    ];
    it.each(confirmCases)('confirm on status %s → %s, record ends %s', async (from, result, to) => {
      const record = makeRecord({ paymentStatusId: from });
      givenRecords([record]);

      const outcome = await service.confirmGatewayPayment(confirmInput());

      expect(outcome.result).toBe(result);
      expect(record.paymentStatusId).toBe(to);
      if (result === GatewayEventResultEnum.APPLIED) {
        expect(transaction.commit).toHaveBeenCalled();
      } else {
        expect(transaction.rollback).toHaveBeenCalled();
        expect(record.save).not.toHaveBeenCalled();
      }
    });

    const failCases: Array<[PaymentStatusEnum, GatewayEventResultEnum, PaymentStatusEnum]> = [
      [PaymentStatusEnum.PENDING, GatewayEventResultEnum.APPLIED, PaymentStatusEnum.FAILED],
      [PaymentStatusEnum.FAILED, GatewayEventResultEnum.IGNORED_STATE, PaymentStatusEnum.FAILED],
      [PaymentStatusEnum.PAID, GatewayEventResultEnum.IGNORED_STATE, PaymentStatusEnum.PAID],
      [PaymentStatusEnum.REFUND, GatewayEventResultEnum.IGNORED_STATE, PaymentStatusEnum.REFUND],
    ];
    it.each(failCases)('failure on status %s → %s, record ends %s', async (from, result, to) => {
      const record = makeRecord({ paymentStatusId: from });
      givenRecords([record]);

      const outcome = await service.markGatewayPaymentFailed({
        gatewayOrderId: 'order_1',
        gatewayPaymentId: 'pay_1',
        requestedIp: '127.0.0.1',
      });

      expect(outcome.result).toBe(result);
      expect(record.paymentStatusId).toBe(to);
    });
  });

  it('sets PAID, capture date, payment id and one invoice number, and emits the plan paid event after commit', async () => {
    const record = makeRecord();
    givenRecords([record]);
    const input = confirmInput();

    const outcome = await service.confirmGatewayPayment(input);

    expect(outcome).toMatchObject({
      result: GatewayEventResultEnum.APPLIED,
      recordType: 'plan',
      memberPaymentId: 101,
      paymentStatusId: PaymentStatusEnum.PAID,
      invoiceId: 'EF/2026-27/S/000001',
    });
    expect(record.paymentDate).toEqual(input.capturedAt);
    expect(record.gatewayPaymentId).toBe('pay_1');
    expect(record.transactionId).toBe('pay_1');
    expect(generateInvoiceNumber).toHaveBeenCalledTimes(1);
    expect(transaction.commit.mock.invocationCallOrder[0]).toBeLessThan(emit.mock.invocationCallOrder[0]);
    expect(emit).toHaveBeenCalledWith('order.plan.paid', expect.objectContaining({ memberPaymentId: 101 }));
  });

  it('issues a PRODUCT invoice and emits order.product.paid for a product record', async () => {
    const record = makeRecord({ memberPaymentId: undefined, memberProductId: 55 });
    givenRecords([], [record]);

    const outcome = await service.confirmGatewayPayment(confirmInput());

    expect(outcome.recordType).toBe('product');
    expect(generateInvoiceNumber.mock.calls[0][3]).toBe(BusinessTypeEnum.PRODUCT);
    expect(emit).toHaveBeenCalledWith('order.product.paid', expect.objectContaining({ memberProductId: 55 }));
  });

  it('captured and order.paid for the same order: the second is IGNORED_STATE and only one invoice number is issued', async () => {
    const record = makeRecord();
    givenRecords([record]);

    const first = await service.confirmGatewayPayment(confirmInput({ gatewayPaymentId: 'pay_1' }));
    const second = await service.confirmGatewayPayment(confirmInput({ gatewayPaymentId: 'pay_1' }));

    expect(first.result).toBe(GatewayEventResultEnum.APPLIED);
    expect(second.result).toBe(GatewayEventResultEnum.IGNORED_STATE);
    expect(generateInvoiceNumber).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledTimes(1);
    expect(record.invoiceId).toBe('EF/2026-27/S/000001');
  });

  it('locks the record rows FOR UPDATE inside the transaction', async () => {
    givenRecords([makeRecord()]);

    await service.confirmGatewayPayment(confirmInput());

    expect(paymentFindAll).toHaveBeenCalledWith(
      expect.objectContaining({ lock: 'UPDATE', transaction, where: { gatewayOrderId: 'order_1', active: true } }),
    );
  });

  it('late payment.failed after PAID is ignored and leaves the invoice in place', async () => {
    const record = makeRecord({ paymentStatusId: PaymentStatusEnum.PAID, invoiceId: 'EF/2026-27/S/000009' });
    givenRecords([record]);

    const outcome = await service.markGatewayPaymentFailed({
      gatewayOrderId: 'order_1',
      gatewayPaymentId: 'pay_2',
      requestedIp: '127.0.0.1',
    });

    expect(outcome.result).toBe(GatewayEventResultEnum.IGNORED_STATE);
    expect(record.paymentStatusId).toBe(PaymentStatusEnum.PAID);
    expect(record.invoiceId).toBe('EF/2026-27/S/000009');
    expect(record.save).not.toHaveBeenCalled();
  });

  it('amount mismatch → ERROR, record stays PENDING, no invoice, no event', async () => {
    const record = makeRecord();
    givenRecords([record]);

    const outcome = await service.confirmGatewayPayment(confirmInput({ amountMinor: 100 }));

    expect(outcome.result).toBe(GatewayEventResultEnum.ERROR);
    expect(outcome.message).toContain('Amount mismatch');
    expect(record.paymentStatusId).toBe(PaymentStatusEnum.PENDING);
    expect(record.save).not.toHaveBeenCalled();
    expect(generateInvoiceNumber).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
    expect(transaction.rollback).toHaveBeenCalled();
  });

  it('currency mismatch → ERROR', async () => {
    givenRecords([makeRecord()]);

    const outcome = await service.confirmGatewayPayment(confirmInput({ currency: 'USD' }));

    expect(outcome.result).toBe(GatewayEventResultEnum.ERROR);
    expect(outcome.message).toContain('Currency mismatch');
  });

  it.each([
    ['JPY', '1500', 1500],
    ['KWD', '12.345', 12345],
    ['USD', '19.99', 1999],
  ])('compares %s amounts in that currency\'s minor units', async (currency, totalAmount, amountMinor) => {
    givenRecords([makeRecord({ currency, totalAmount })]);

    const outcome = await service.confirmGatewayPayment(confirmInput({ currency, amountMinor }));

    expect(outcome.result).toBe(GatewayEventResultEnum.APPLIED);
  });

  it('counts the promo code once, even when the confirmation is repeated', async () => {
    const record = makeRecord({ promoCode: 'SAVE10' });
    givenRecords([record]);

    await service.confirmGatewayPayment(confirmInput());
    await service.confirmGatewayPayment(confirmInput());

    expect(recordUsage).toHaveBeenCalledTimes(1);
    expect(recordUsage).toHaveBeenCalledWith('SAVE10', transaction);
  });

  it('accepts the payment but flags a promo code used past its limit', async () => {
    recordUsage.mockResolvedValue({ overLimit: true });
    const record = makeRecord({ promoCode: 'SAVE10' });
    givenRecords([record]);

    const outcome = await service.confirmGatewayPayment(confirmInput());

    expect(outcome.result).toBe(GatewayEventResultEnum.APPLIED);
    expect(outcome.promoOverLimit).toBe(true);
    expect(record.paymentStatusId).toBe(PaymentStatusEnum.PAID);
  });

  it('ORDER_NOT_FOUND when no record has the gateway order id', async () => {
    givenRecords([]);

    const outcome = await service.confirmGatewayPayment(confirmInput());

    expect(outcome.result).toBe(GatewayEventResultEnum.ORDER_NOT_FOUND);
    expect(transaction.rollback).toHaveBeenCalled();
  });

  it('ERROR when the gateway order id matches more than one record', async () => {
    givenRecords([makeRecord(), makeRecord({ memberPaymentId: 102 })]);

    const outcome = await service.confirmGatewayPayment(confirmInput());

    expect(outcome.result).toBe(GatewayEventResultEnum.ERROR);
    expect(generateInvoiceNumber).not.toHaveBeenCalled();
  });

  it('rolls back and rethrows when invoice issue fails', async () => {
    generateInvoiceNumber.mockRejectedValue(new Error('sequence locked'));
    givenRecords([makeRecord()]);

    await expect(service.confirmGatewayPayment(confirmInput())).rejects.toThrow('sequence locked');
    expect(transaction.rollback).toHaveBeenCalled();
    expect(transaction.commit).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
  });

  it('ignores a refund event older than the stored one (refunds only grow)', async () => {
    const record = makeRecord({
      paymentStatusId: PaymentStatusEnum.PAID,
      refundObj: { refundStatus: 'full', amountRefunded: 1180 },
    });
    givenRecords([record]);

    const outcome = await service.recordGatewayRefund({
      gatewayOrderId: 'order_1',
      refundStatus: 'partial',
      amountRefundedMinor: 50000,
      currency: 'INR',
      requestedIp: '127.0.0.1',
    });

    expect(outcome.result).toBe(GatewayEventResultEnum.IGNORED_STATE);
    expect(record.refundObj).toMatchObject({ amountRefunded: 1180 });
    expect(record.save).not.toHaveBeenCalled();
  });

  it('stores the refund in major units without changing status', async () => {
    const record = makeRecord({ paymentStatusId: PaymentStatusEnum.PAID });
    givenRecords([record]);

    const outcome = await service.recordGatewayRefund({
      gatewayOrderId: 'order_1',
      refundStatus: 'full',
      amountRefundedMinor: 118000,
      currency: 'INR',
      requestedIp: '127.0.0.1',
    });

    expect(outcome.result).toBe(GatewayEventResultEnum.APPLIED);
    expect(record.paymentStatusId).toBe(PaymentStatusEnum.PAID);
    expect(record.refundObj).toMatchObject({ refundStatus: 'full', amountRefunded: 1180 });
  });
});
