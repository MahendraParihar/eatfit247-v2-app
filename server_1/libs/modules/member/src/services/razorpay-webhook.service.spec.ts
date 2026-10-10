import { ConflictException } from '@nestjs/common';
import { UniqueConstraintError } from 'sequelize';
import { GatewayEventResultEnum, RazorpayWebhookPayload } from '@eatfit247-shared-lib';
import { TxnPaymentGatewayEvent } from '../models';
import {
  IGatewayConfirmationResult,
  PaymentConfirmationService,
} from './payment-confirmation.service';
import { RazorpayWebhookService } from './razorpay-webhook.service';

const applied: IGatewayConfirmationResult = {
  result: GatewayEventResultEnum.APPLIED,
  recordType: 'plan',
  memberPaymentId: 101,
  memberProductId: null,
  paymentStatusId: 1,
  invoiceId: 'EF/2026-27/S/000001',
  promoOverLimit: false,
};

const paymentEntity = {
  id: 'pay_1',
  entity: 'payment',
  amount: 118000,
  currency: 'INR',
  status: 'captured',
  order_id: 'order_1',
  amount_refunded: 0,
  refund_status: null,
  notes: { franchisePaymentGatewayId: '1' },
  created_at: 1760072400,
};

const event = (name: string, payload: RazorpayWebhookPayload['payload']): RazorpayWebhookPayload =>
  ({ entity: 'event', account_id: 'acc_1', event: name, contains: Object.keys(payload), payload }) as RazorpayWebhookPayload;

describe('RazorpayWebhookService', () => {
  let service: RazorpayWebhookService;
  let create: jest.Mock;
  let findOne: jest.Mock;
  let eventRow: { update: jest.Mock };
  let confirmation: {
    confirmGatewayPayment: jest.Mock;
    markGatewayPaymentFailed: jest.Mock;
    recordGatewayRefund: jest.Mock;
    findRecordRef: jest.Mock;
    findExistingRecordIds: jest.Mock;
  };

  beforeEach(() => {
    eventRow = { update: jest.fn().mockResolvedValue(undefined) };
    create = jest.fn().mockResolvedValue(eventRow);
    findOne = jest.fn();
    confirmation = {
      confirmGatewayPayment: jest.fn().mockResolvedValue(applied),
      markGatewayPaymentFailed: jest.fn().mockResolvedValue(applied),
      recordGatewayRefund: jest.fn().mockResolvedValue(applied),
      findRecordRef: jest.fn().mockResolvedValue({ recordType: 'plan', memberPaymentId: 101, memberProductId: null }),
      findExistingRecordIds: jest.fn().mockResolvedValue({ memberPaymentId: 777, memberProductId: null }),
    };
    service = new RazorpayWebhookService(
      { create, findOne } as unknown as typeof TxnPaymentGatewayEvent,
      confirmation as unknown as PaymentConfirmationService,
    );
  });

  it('logs the event, confirms payment.captured with minor units, and records the result', async () => {
    const res = await service.handleVerifiedEvent(
      'evt_1',
      event('payment.captured', { payment: { entity: paymentEntity } } as RazorpayWebhookPayload['payload']),
      '1.2.3.4',
    );

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'RAZORPAY',
        eventId: 'evt_1',
        eventType: 'payment.captured',
        gatewayOrderId: 'order_1',
        gatewayPaymentId: 'pay_1',
        amount: 1180,
        currency: 'INR',
        signatureValid: true,
      }),
    );
    expect(confirmation.confirmGatewayPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        gatewayOrderId: 'order_1',
        gatewayPaymentId: 'pay_1',
        amountMinor: 118000,
        currency: 'INR',
        capturedAt: new Date(1760072400 * 1000),
      }),
    );
    expect(eventRow.update).toHaveBeenCalledWith(
      expect.objectContaining({ result: GatewayEventResultEnum.APPLIED, memberPaymentId: 101 }),
    );
    expect(res).toEqual({ status: 'success', result: GatewayEventResultEnum.APPLIED, message: undefined });
  });

  it('order.paid goes through the same confirmation', async () => {
    await service.handleVerifiedEvent(
      'evt_2',
      event('order.paid', { payment: { entity: paymentEntity } } as RazorpayWebhookPayload['payload']),
      '1.2.3.4',
    );

    expect(confirmation.confirmGatewayPayment).toHaveBeenCalledTimes(1);
  });

  it('duplicate event id with a final result → IGNORED_DUPLICATE and nothing processed', async () => {
    create.mockRejectedValue(new UniqueConstraintError({}));
    findOne.mockResolvedValue({ result: GatewayEventResultEnum.APPLIED });

    const res = await service.handleVerifiedEvent(
      'evt_1',
      event('payment.captured', { payment: { entity: paymentEntity } } as RazorpayWebhookPayload['payload']),
      '1.2.3.4',
    );

    expect(res).toEqual({ status: 'duplicate', result: GatewayEventResultEnum.IGNORED_DUPLICATE });
    expect(confirmation.confirmGatewayPayment).not.toHaveBeenCalled();
  });

  it('a redelivery while the first delivery is still processing gets 409 so the gateway retries later', async () => {
    create.mockRejectedValue(new UniqueConstraintError({}));
    findOne.mockResolvedValue({ result: null, createdAt: new Date(), update: jest.fn() });

    await expect(
      service.handleVerifiedEvent(
        'evt_1',
        event('payment.captured', { payment: { entity: paymentEntity } } as RazorpayWebhookPayload['payload']),
        '1.2.3.4',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(confirmation.confirmGatewayPayment).not.toHaveBeenCalled();
  });

  it('an event left unfinished for over 5 minutes is processed again', async () => {
    const stale = { result: null, createdAt: new Date(Date.now() - 6 * 60 * 1000), update: jest.fn() };
    create.mockRejectedValue(new UniqueConstraintError({}));
    findOne.mockResolvedValue(stale);

    await service.handleVerifiedEvent(
      'evt_1',
      event('payment.captured', { payment: { entity: paymentEntity } } as RazorpayWebhookPayload['payload']),
      '1.2.3.4',
    );

    expect(confirmation.confirmGatewayPayment).toHaveBeenCalledTimes(1);
  });

  it('a redelivered event that previously errored is processed again on the same row', async () => {
    const existing = { result: GatewayEventResultEnum.ERROR, update: jest.fn() };
    create.mockRejectedValue(new UniqueConstraintError({}));
    findOne.mockResolvedValue(existing);

    await service.handleVerifiedEvent(
      'evt_1',
      event('payment.captured', { payment: { entity: paymentEntity } } as RazorpayWebhookPayload['payload']),
      '1.2.3.4',
    );

    expect(confirmation.confirmGatewayPayment).toHaveBeenCalledTimes(1);
    expect(existing.update).toHaveBeenCalledWith(expect.objectContaining({ result: GatewayEventResultEnum.APPLIED }));
  });

  it('payment_link.paid confirms against the link id and amount_paid', async () => {
    const link = {
      id: 'plink_1',
      entity: 'payment_link',
      amount: 118000,
      amount_paid: 118000,
      currency: 'INR',
      status: 'paid',
      notes: {},
      created_at: 1760000000,
    };
    await service.handleVerifiedEvent(
      'evt_3',
      event('payment_link.paid', {
        payment_link: { entity: link },
        payment: { entity: { ...paymentEntity, order_id: 'order_internal' } },
      } as RazorpayWebhookPayload['payload']),
      '1.2.3.4',
    );

    expect(confirmation.confirmGatewayPayment).toHaveBeenCalledWith(
      expect.objectContaining({ gatewayOrderId: 'plink_1', gatewayPaymentId: 'pay_1', amountMinor: 118000 }),
    );
  });

  it('payment.captured for a payment-link payment is left to payment_link.paid', async () => {
    const res = await service.handleVerifiedEvent(
      'evt_4',
      event('payment.captured', {
        payment: { entity: paymentEntity },
        payment_link: { entity: { id: 'plink_1', amount: 118000, currency: 'INR' } },
      } as RazorpayWebhookPayload['payload']),
      '1.2.3.4',
    );

    expect(res.result).toBe(GatewayEventResultEnum.IGNORED_STATE);
    expect(confirmation.confirmGatewayPayment).not.toHaveBeenCalled();
  });

  it('payment.failed only goes through markGatewayPaymentFailed', async () => {
    await service.handleVerifiedEvent(
      'evt_5',
      event('payment.failed', { payment: { entity: { ...paymentEntity, status: 'failed' } } } as RazorpayWebhookPayload['payload']),
      '1.2.3.4',
    );

    expect(confirmation.markGatewayPaymentFailed).toHaveBeenCalledWith(
      expect.objectContaining({ gatewayOrderId: 'order_1', gatewayPaymentId: 'pay_1' }),
    );
    expect(confirmation.confirmGatewayPayment).not.toHaveBeenCalled();
  });

  it.each(['payment.refunded', 'refund.created'])('%s stores the refund amount in minor units', async (name) => {
    await service.handleVerifiedEvent(
      `evt_${name}`,
      event(name, {
        payment: { entity: { ...paymentEntity, amount_refunded: 50000, refund_status: 'partial' } },
      } as RazorpayWebhookPayload['payload']),
      '1.2.3.4',
    );

    expect(confirmation.recordGatewayRefund).toHaveBeenCalledWith(
      expect.objectContaining({ gatewayOrderId: 'order_1', amountRefundedMinor: 50000, refundStatus: 'partial' }),
    );
  });

  it.each(['payment_link.partially_paid', 'payment_link.cancelled', 'payment_link.expired'])(
    '%s is logged only and linked to its record',
    async (name) => {
      const res = await service.handleVerifiedEvent(
        `evt_${name}`,
        event(name, {
          payment_link: { entity: { id: 'plink_1', amount: 118000, amount_paid: 50000, currency: 'INR' } },
        } as RazorpayWebhookPayload['payload']),
        '1.2.3.4',
      );

      expect(res.result).toBe(GatewayEventResultEnum.IGNORED_STATE);
      expect(confirmation.confirmGatewayPayment).not.toHaveBeenCalled();
      expect(confirmation.markGatewayPaymentFailed).not.toHaveBeenCalled();
      expect(eventRow.update).toHaveBeenCalledWith(expect.objectContaining({ memberPaymentId: 101 }));
    },
  );

  it('an ORDER_NOT_FOUND event is linked to the record its signed notes name', async () => {
    confirmation.confirmGatewayPayment.mockResolvedValue({ ...applied, result: GatewayEventResultEnum.ORDER_NOT_FOUND, memberPaymentId: null });

    await service.handleVerifiedEvent(
      'evt_nf',
      event('payment.captured', {
        payment: { entity: { ...paymentEntity, notes: { franchisePaymentGatewayId: '1', memberPaymentId: '777' } } },
      } as RazorpayWebhookPayload['payload']),
      '1.2.3.4',
    );

    expect(confirmation.findExistingRecordIds).toHaveBeenCalledWith({ memberPaymentId: 777, memberProductId: null });
    expect(eventRow.update).toHaveBeenCalledWith(
      expect.objectContaining({ result: GatewayEventResultEnum.ORDER_NOT_FOUND, memberPaymentId: 777 }),
    );
  });

  it('records ERROR on the event and rethrows when processing throws', async () => {
    confirmation.confirmGatewayPayment.mockRejectedValue(new Error('db down'));

    await expect(
      service.handleVerifiedEvent(
        'evt_6',
        event('payment.captured', { payment: { entity: paymentEntity } } as RazorpayWebhookPayload['payload']),
        '1.2.3.4',
      ),
    ).rejects.toThrow('db down');
    expect(eventRow.update).toHaveBeenCalledWith(
      expect.objectContaining({ result: GatewayEventResultEnum.ERROR, message: 'db down' }),
    );
  });
});
