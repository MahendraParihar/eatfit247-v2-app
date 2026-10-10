import { BadRequestException, ConflictException } from '@nestjs/common';
import { AppConfigService } from '@server_1/core';
import {
  PaymentGatewayCredentialService,
  PaymentGatewayFactory,
  PaymentGatewayResolverService,
} from '@server_1/modules/payment';
import { PromoCodeService } from '@server_1/modules/promo-code';
import { GatewayEventResultEnum } from '@eatfit247-shared-lib';
import { UniqueConstraintError } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { CheckoutGatewayService } from './checkout-gateway.service';
import { TxnPaymentGatewayEvent } from '../models';
import { PaymentConfirmationService } from './payment-confirmation.service';

describe('CheckoutGatewayService', () => {
  let service: CheckoutGatewayService;
  let applyPromoCode: jest.Mock;
  let resolve: jest.Mock;
  let adaptor: {
    createOrder: jest.Mock;
    verifyPayment: jest.Mock;
    fetchPayment: jest.Mock;
    createPaymentLink: jest.Mock;
    cancelPaymentLink: jest.Mock;
  };
  let confirmGatewayPayment: jest.Mock;
  let eventCreate: jest.Mock;

  beforeEach(() => {
    applyPromoCode = jest.fn();
    resolve = jest.fn().mockResolvedValue({
      franchisePaymentGatewayId: 7,
      gatewayCode: 'RAZORPAY',
      providerCountryCode: 'IN',
      currency: 'INR',
    });
    adaptor = {
      createOrder: jest.fn().mockResolvedValue({ id: 'order_new' }),
      createPaymentLink: jest.fn().mockResolvedValue({ id: 'plink_new', short_url: 'https://rzp.io/l/x' }),
      cancelPaymentLink: jest.fn().mockResolvedValue({ status: 'cancelled' }),
      verifyPayment: jest.fn().mockResolvedValue({ verified: true }),
      fetchPayment: jest.fn().mockResolvedValue({
        id: 'pay_1',
        orderId: 'order_1',
        status: 'captured',
        amountMinor: 118000,
        currency: 'INR',
        createdAt: new Date('2026-10-10T05:00:00Z'),
        raw: { id: 'pay_1' },
      }),
    };
    confirmGatewayPayment = jest.fn().mockResolvedValue({
      result: GatewayEventResultEnum.APPLIED,
      memberPaymentId: 900,
      memberProductId: null,
      promoOverLimit: false,
    });
    eventCreate = jest.fn().mockResolvedValue({});
    service = new CheckoutGatewayService(
      { getString: jest.fn().mockReturnValue('TEST') } as unknown as AppConfigService,
      { resolve } as unknown as PaymentGatewayResolverService,
      {
        getActiveCredentials: jest.fn().mockResolvedValue({ apiKeyEncrypted: 'rzp_key', apiSecretEncrypted: 'secret' }),
      } as unknown as PaymentGatewayCredentialService,
      { getAdapter: jest.fn().mockReturnValue(adaptor) } as unknown as PaymentGatewayFactory,
      { applyPromoCode } as unknown as PromoCodeService,
      { confirmGatewayPayment } as unknown as PaymentConfirmationService,
      { create: eventCreate } as unknown as typeof TxnPaymentGatewayEvent,
      { query: jest.fn() } as unknown as Sequelize,
    );
  });

  describe('applyPromoCode', () => {
    it('no code → no discount', async () => {
      await expect(service.applyPromoCode(undefined, 1000, 'INR')).resolves.toEqual({ promoCode: null, discountAmount: 0 });
      expect(applyPromoCode).not.toHaveBeenCalled();
    });

    it('an invalid code is a 400 with the promo service message', async () => {
      applyPromoCode.mockResolvedValue({ valid: false, discountAmount: 0, finalAmount: 1000, message: 'Promo code has expired' });

      await expect(service.applyPromoCode('OLD', 1000, 'INR')).rejects.toThrow(
        new BadRequestException('Promo code has expired'),
      );
    });

    it('promo codes (rupee amounts, no currency yet) are refused for non-INR payments', async () => {
      await expect(service.applyPromoCode('SAVE10', 100, 'USD')).rejects.toThrow(
        'Promo codes can only be used for INR payments',
      );
      expect(applyPromoCode).not.toHaveBeenCalled();
    });

    it('rounds the discount to the currency and caps it at the order amount', async () => {
      applyPromoCode.mockResolvedValue({ valid: true, discountAmount: '333.3333', finalAmount: 0, message: 'ok' });
      await expect(service.applyPromoCode(' save10 ', 1000, 'INR')).resolves.toMatchObject({
        promoCode: 'SAVE10',
        discountAmount: 333.33,
      });

      applyPromoCode.mockResolvedValue({ valid: true, discountAmount: 5000, finalAmount: 0 });
      await expect(service.applyPromoCode('BIG', 1000, 'INR')).resolves.toMatchObject({ discountAmount: 1000 });
    });
  });

  describe('createGatewayOrder', () => {
    const input = {
      franchiseId: 1,
      currency: 'INR',
      amount: 1180,
      receipt: 'plan_5',
      description: 'Plan',
      customer: { name: 'Test' },
      notes: { memberId: '4945', type: 'plan' },
    };

    it('creates the gateway order for exactly the stored total and adds the gateway to the notes', async () => {
      const order = await service.createGatewayOrder(input);

      expect(adaptor.createOrder).toHaveBeenCalledWith(
        1180,
        'plan_5',
        'INR',
        { memberId: '4945', type: 'plan', franchisePaymentGatewayId: '7' },
        { keyId: 'rzp_key', keySecret: 'secret' },
      );
      expect(order).toMatchObject({
        gatewayCode: 'RAZORPAY',
        gatewayOrderId: 'order_new',
        keyId: 'rzp_key',
        amount: 1180,
        amountMinor: 118000,
        franchisePaymentGatewayId: 7,
      });
    });

    it('rejects a zero total, a mismatched requested gateway, and gateways without server confirmation', async () => {
      await expect(service.createGatewayOrder({ ...input, amount: 0 })).rejects.toBeInstanceOf(BadRequestException);
      await expect(service.createGatewayOrder({ ...input, requestedGatewayId: 99 })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      resolve.mockResolvedValue({ franchisePaymentGatewayId: 2, gatewayCode: 'TELR', providerCountryCode: 'AE', currency: 'AED' });
      await expect(service.createGatewayOrder(input)).rejects.toThrow('Online checkout is not available for TELR yet');
      expect(adaptor.createOrder).not.toHaveBeenCalled();
    });
  });

  describe('verifyAndConfirm', () => {
    const input = {
      gatewayOrderId: 'order_1',
      gatewayProvider: 'RAZORPAY',
      franchisePaymentGatewayId: 7,
      paymentId: 'pay_1',
      signature: 'sig',
      requestedIp: '127.0.0.1',
    };

    it('confirms a captured payment using the amount fetched from the gateway', async () => {
      const result = await service.verifyAndConfirm(input);

      expect(result.captured).toBe(true);
      expect(confirmGatewayPayment).toHaveBeenCalledWith(
        expect.objectContaining({ gatewayOrderId: 'order_1', gatewayPaymentId: 'pay_1', amountMinor: 118000, currency: 'INR' }),
      );
    });

    it('logs the verify outcome once per payment, keeping the over-limit promo flag', async () => {
      confirmGatewayPayment.mockResolvedValue({
        result: GatewayEventResultEnum.APPLIED,
        memberPaymentId: 900,
        memberProductId: null,
        promoOverLimit: true,
      });

      await service.verifyAndConfirm(input);

      expect(eventCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'RAZORPAY',
          eventId: 'verify:pay_1',
          eventType: 'checkout.verify',
          result: GatewayEventResultEnum.APPLIED,
          promoOverLimit: true,
          memberPaymentId: 900,
          amount: 1180,
        }),
      );
    });

    it('a repeated verify for the same payment does not fail on the existing log row', async () => {
      eventCreate.mockRejectedValue(new UniqueConstraintError({}));

      await expect(service.verifyAndConfirm(input)).resolves.toMatchObject({ captured: true });
    });

    it('a forged signature is not verified and nothing is confirmed or fetched', async () => {
      adaptor.verifyPayment.mockResolvedValue({ verified: false });

      const result = await service.verifyAndConfirm(input);

      expect(result.captured).toBe(false);
      expect(adaptor.fetchPayment).not.toHaveBeenCalled();
      expect(confirmGatewayPayment).not.toHaveBeenCalled();
    });

    it('an uncaptured payment is not confirmed', async () => {
      adaptor.fetchPayment.mockResolvedValue({ id: 'pay_1', orderId: 'order_1', status: 'authorized', amountMinor: 118000, currency: 'INR', createdAt: new Date(), raw: {} });

      const result = await service.verifyAndConfirm(input);

      expect(result).toMatchObject({ captured: false, gatewayStatus: 'authorized' });
      expect(confirmGatewayPayment).not.toHaveBeenCalled();
    });

    it('a gateway fetch error is not verified (no 500) and nothing is confirmed', async () => {
      adaptor.fetchPayment.mockRejectedValue(new Error('The id provided does not exist'));

      const result = await service.verifyAndConfirm(input);

      expect(result.captured).toBe(false);
      expect(confirmGatewayPayment).not.toHaveBeenCalled();
    });

    it('a payment for a different order is not confirmed', async () => {
      adaptor.fetchPayment.mockResolvedValue({ id: 'pay_1', orderId: 'order_other', status: 'captured', amountMinor: 118000, currency: 'INR', createdAt: new Date(), raw: {} });

      const result = await service.verifyAndConfirm(input);

      expect(result.captured).toBe(false);
      expect(confirmGatewayPayment).not.toHaveBeenCalled();
    });

    it('a record without a stored gateway cannot be verified', async () => {
      await expect(service.verifyAndConfirm({ ...input, franchisePaymentGatewayId: null })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('payment links (admin)', () => {
    it('cancels with the stored gateway, or resolves it for records from before 4.5', async () => {
      await expect(
        service.cancelGatewayPaymentLink({ paymentLinkId: 'plink_1', gatewayProvider: 'RAZORPAY', franchisePaymentGatewayId: 7 }),
      ).resolves.toEqual({ cancelled: true, status: 'cancelled' });

      resolve.mockClear();
      await service.cancelGatewayPaymentLink({
        paymentLinkId: 'plink_old',
        gatewayProvider: null,
        franchisePaymentGatewayId: null,
        fallback: { franchiseId: 1, currency: 'INR', amount: 1180 },
      });
      expect(resolve).toHaveBeenCalledWith(expect.objectContaining({ franchiseId: 1, currency: 'INR' }));
      expect(adaptor.cancelPaymentLink).toHaveBeenLastCalledWith('plink_old', { keyId: 'rzp_key', keySecret: 'secret' });
    });

    it('reports an already-paid link as not cancelled', async () => {
      adaptor.cancelPaymentLink.mockResolvedValue({ status: 'paid' });

      await expect(
        service.cancelGatewayPaymentLink({ paymentLinkId: 'plink_1', gatewayProvider: 'RAZORPAY', franchisePaymentGatewayId: 7 }),
      ).resolves.toEqual({ cancelled: false, status: 'paid' });
    });

    it('turns a Razorpay SDK rejection (a plain object) into 400/409 instead of a 500', async () => {
      adaptor.cancelPaymentLink.mockRejectedValue({ statusCode: 400, error: { description: 'cannot cancel or expire a cancelled link' } });
      await expect(
        service.cancelGatewayPaymentLink({ paymentLinkId: 'plink_1', gatewayProvider: 'RAZORPAY', franchisePaymentGatewayId: 7 }),
      ).rejects.toBeInstanceOf(BadRequestException);

      adaptor.createPaymentLink.mockRejectedValue({ statusCode: 400, error: { description: 'Payment link already paid' } });
      await expect(
        service.createGatewayPaymentLink({
          franchiseId: 1, currency: 'INR', amount: 1180, receipt: 'r', description: 'd', customer: {}, notes: {},
        }),
      ).rejects.toBeInstanceOf(ConflictException);

      adaptor.cancelPaymentLink.mockRejectedValue({ error: { description: 'Link is unpaid and cannot be expired yet' } });
      await expect(
        service.cancelGatewayPaymentLink({ paymentLinkId: 'plink_1', gatewayProvider: 'RAZORPAY', franchisePaymentGatewayId: 7 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('maps a Postgres lock timeout (55P03) to 409 and leaves other errors alone', () => {
      expect(service.mapLockTimeout({ original: { code: '55P03' } })).toBeInstanceOf(ConflictException);
      const other = new Error('boom');
      expect(service.mapLockTimeout(other)).toBe(other);
    });
  });
});
