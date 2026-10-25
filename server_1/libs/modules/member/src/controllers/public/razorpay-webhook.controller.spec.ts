import { UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { AppConfigService } from '@server_1/core';
import { PaymentGatewayCredentialService } from '@server_1/modules/payment';
import { GatewayEventResultEnum } from '@eatfit247-shared-lib';
import { RazorpayWebhookController } from './razorpay-webhook.controller';
import { RazorpayWebhookService } from '../../services/razorpay-webhook.service';

describe('RazorpayWebhookController', () => {
  const webhookSecret = 'test_webhook_secret';
  const body = {
    entity: 'event',
    account_id: 'acc_test',
    event: 'payment.captured',
    contains: ['payment'],
    payload: {
      payment: {
        entity: {
          id: 'pay_test123',
          entity: 'payment',
          amount: 10000,
          currency: 'INR',
          status: 'captured',
          order_id: 'order_test123',
          notes: { franchisePaymentGatewayId: '1' },
          created_at: 1760072400,
        },
      },
    },
  };
  const rawBody = JSON.stringify(body);
  const sign = (raw: string): string => crypto.createHmac('sha256', webhookSecret).update(raw).digest('hex');

  let controller: RazorpayWebhookController;
  let getActiveCredentials: jest.Mock;
  let handleVerifiedEvent: jest.Mock;
  let findStoredGatewayId: jest.Mock;

  beforeEach(() => {
    getActiveCredentials = jest.fn().mockResolvedValue({ webhookSecretEncrypted: webhookSecret });
    handleVerifiedEvent = jest
      .fn()
      .mockResolvedValue({ status: 'success', result: GatewayEventResultEnum.APPLIED });
    findStoredGatewayId = jest.fn().mockResolvedValue(null);
    controller = new RazorpayWebhookController(
      { getActiveCredentials } as unknown as PaymentGatewayCredentialService,
      { getString: jest.fn().mockReturnValue('test') } as unknown as AppConfigService,
      { handleVerifiedEvent, findStoredGatewayId } as unknown as RazorpayWebhookService,
    );
  });

  it('verifies the signature and hands the raw-body payload and event id to the service', async () => {
    const res = await controller.handleWebhook({ rawBody }, sign(rawBody), '127.0.0.1', 'evt_123');

    expect(getActiveCredentials).toHaveBeenCalledWith(1, 'test');
    expect(handleVerifiedEvent).toHaveBeenCalledWith('evt_123', body, '127.0.0.1');
    expect(res.result).toBe(GatewayEventResultEnum.APPLIED);
  });

  it('falls back to a hash of the raw body when the event id header is missing', async () => {
    await controller.handleWebhook({ rawBody }, sign(rawBody), '127.0.0.1');

    const expectedId = crypto.createHash('sha256').update(rawBody).digest('hex');
    expect(handleVerifiedEvent).toHaveBeenCalledWith(expectedId, body, '127.0.0.1');
  });

  it('accepts a real payment_link.paid body with fields no DTO listed (no whitelist on gateway payloads)', async () => {
    const realBody = JSON.stringify({
      entity: 'event',
      account_id: 'acc_test',
      event: 'payment_link.paid',
      contains: ['payment_link', 'payment'],
      payload: {
        payment_link: {
          entity: {
            id: 'plink_1', amount: 118000, amount_paid: 118000, currency: 'INR', status: 'paid',
            allow_full_payment: true, payment_plan: null, payments: [{ payment_id: 'pay_1' }],
            customer: { name: '', email: '', contact: '' },
            notes: { franchisePaymentGatewayId: '1' },
          },
        },
      },
    });

    await controller.handleWebhook({ rawBody: realBody }, sign(realBody), '127.0.0.1', 'evt_link');

    expect(handleVerifiedEvent).toHaveBeenCalledWith('evt_link', JSON.parse(realBody), '127.0.0.1');
  });

  it('finds the gateway in the link notes when the payment notes are an empty array', async () => {
    const linkPaid = JSON.stringify({
      entity: 'event',
      event: 'payment_link.paid',
      contains: ['payment_link', 'payment'],
      payload: {
        payment_link: { entity: { id: 'plink_1', amount: 118000, amount_paid: 118000, currency: 'INR', notes: { franchisePaymentGatewayId: '1' } } },
        payment: { entity: { id: 'pay_1', amount: 118000, currency: 'INR', status: 'captured', notes: [] } },
      },
    });

    await controller.handleWebhook({ rawBody: linkPaid }, sign(linkPaid), '127.0.0.1', 'evt_arr');

    expect(getActiveCredentials).toHaveBeenCalledWith(1, 'test');
    expect(handleVerifiedEvent).toHaveBeenCalled();
  });

  it('uses the gateway stored on the record when no notes carry it (signature still checked)', async () => {
    const noNotes = JSON.stringify({
      entity: 'event',
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_1', order_id: 'order_1', amount: 100, currency: 'INR', notes: [] } } },
    });
    findStoredGatewayId.mockResolvedValue(3);

    await controller.handleWebhook({ rawBody: noNotes }, sign(noNotes), '127.0.0.1', 'evt_nn');
    expect(getActiveCredentials).toHaveBeenCalledWith(3, 'test');

    await expect(controller.handleWebhook({ rawBody: noNotes }, sign('forged'), '127.0.0.1', 'evt_nn2')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a body that is not JSON or not an event', async () => {
    await expect(controller.handleWebhook({ rawBody: 'not json' }, sign('not json'), '127.0.0.1')).rejects.toThrow(
      'not valid JSON',
    );
    const noEvent = JSON.stringify({ hello: 'world' });
    await expect(controller.handleWebhook({ rawBody: noEvent }, sign(noEvent), '127.0.0.1')).rejects.toThrow(
      'not a Razorpay event',
    );
  });

  it('rejects an invalid signature without processing or logging the event', async () => {
    await expect(
      controller.handleWebhook({ rawBody }, sign('tampered'), '127.0.0.1', 'evt_123'),
    ).rejects.toThrow(UnauthorizedException);
    expect(handleVerifiedEvent).not.toHaveBeenCalled();
  });

  it('rejects a body changed after signing', async () => {
    const tampered = rawBody.replace('10000', '1');
    await expect(
      controller.handleWebhook({ rawBody: tampered }, sign(rawBody), '127.0.0.1', 'evt_123'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects a missing signature header', async () => {
    await expect(controller.handleWebhook({ rawBody }, '', '127.0.0.1')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a missing raw body', async () => {
    await expect(
      controller.handleWebhook({ rawBody: null }, sign(rawBody), '127.0.0.1'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects when no gateway credentials exist', async () => {
    getActiveCredentials.mockResolvedValue(null);
    await expect(
      controller.handleWebhook({ rawBody }, sign(rawBody), '127.0.0.1'),
    ).rejects.toThrow(UnauthorizedException);
  });
});
