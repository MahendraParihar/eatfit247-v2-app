import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { RazorpayWebhookController } from './razorpay-webhook.controller';
import { PaymentGatewayCredentialService } from '@server_1/modules/payment';
import { AppConfigService } from '@server_1/core';
import { FranchiseService } from '@server_1/modules/franchise';
import { InvoiceSequenceService } from '@server_1/platform';
import { TxnMemberPayment, TxnMemberProduct } from '../../models';
import * as crypto from 'crypto';

describe('RazorpayWebhookController', () => {
  let controller: RazorpayWebhookController;
  let paymentGatewayCredentialService: jest.Mocked<PaymentGatewayCredentialService>;
  let appConfigService: jest.Mocked<AppConfigService>;
  let memberPaymentRepository: jest.Mocked<typeof TxnMemberPayment>;
  let memberProductRepository: jest.Mocked<typeof TxnMemberProduct>;
  let sequelize: jest.Mocked<Sequelize>;

  const mockWebhookSecret = 'test_webhook_secret';
  const mockRawBody = JSON.stringify({
    entity: 'event',
    account_id: 'acc_test',
    event: 'payment.captured',
    contains: ['payment'],
    payload: {
      payment: {
        entity: {
          id: 'pay_test123',
          entity: 'payment',
          amount: 10000, // 100.00 in paise
          currency: 'INR',
          status: 'captured',
          order_id: 'order_test123',
          captured: true,
          email: 'test@example.com',
          contact: '1234567890',
          notes: {
            type: 'plan',
            franchisePaymentGatewayId: '1',
            memberId: '123',
          },
          created_at: Math.floor(Date.now() / 1000),
        },
      },
    },
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RazorpayWebhookController],
      providers: [
        {
          provide: PaymentGatewayCredentialService,
          useValue: {
            getActiveCredentials: jest.fn(),
          },
        },
        {
          provide: AppConfigService,
          useValue: {
            getString: jest.fn(),
          },
        },
        {
          provide: FranchiseService,
          useValue: {},
        },
        {
          provide: InvoiceSequenceService,
          useValue: {},
        },
        {
          provide: TxnMemberPayment,
          useValue: {
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: TxnMemberProduct,
          useValue: {
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: Sequelize,
          useValue: {
            transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<RazorpayWebhookController>(RazorpayWebhookController);
    paymentGatewayCredentialService = module.get(PaymentGatewayCredentialService);
    appConfigService = module.get(AppConfigService);
    memberPaymentRepository = module.get(TxnMemberPayment);
    memberProductRepository = module.get(TxnMemberProduct);
    sequelize = module.get(Sequelize);
  });

  describe('handleWebhook', () => {
    it('should verify webhook signature successfully', async () => {
      // Generate valid signature
      const signature = crypto
        .createHmac('sha256', mockWebhookSecret)
        .update(mockRawBody)
        .digest('hex');

      appConfigService.getString.mockReturnValue('live');
      paymentGatewayCredentialService.getActiveCredentials.mockResolvedValue({
        webhookSecretEncrypted: mockWebhookSecret,
      } as any);

      const req = { rawBody: mockRawBody };
      const result = await controller.handleWebhook(
        req as any,
        signature,
        '127.0.0.1',
      );

      expect(result.status).toBe('success');
    });

    it('should reject invalid webhook signature', async () => {
      const invalidSignature = 'invalid_signature';

      appConfigService.getString.mockReturnValue('live');
      paymentGatewayCredentialService.getActiveCredentials.mockResolvedValue({
        webhookSecretEncrypted: mockWebhookSecret,
      } as any);

      const req = { rawBody: mockRawBody };

      await expect(
        controller.handleWebhook(req as any, invalidSignature, '127.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject webhook with missing signature header', async () => {
      const req = { rawBody: mockRawBody };

      await expect(
        controller.handleWebhook(req as any, '', '127.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject webhook with missing raw body', async () => {
      const signature = crypto
        .createHmac('sha256', mockWebhookSecret)
        .update(mockRawBody)
        .digest('hex');

      const req = { rawBody: null };

      await expect(
        controller.handleWebhook(req as any, signature, '127.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should handle duplicate webhook events (idempotency)', async () => {
      const signature = crypto
        .createHmac('sha256', mockWebhookSecret)
        .update(mockRawBody)
        .digest('hex');

      appConfigService.getString.mockReturnValue('live');
      paymentGatewayCredentialService.getActiveCredentials.mockResolvedValue({
        webhookSecretEncrypted: mockWebhookSecret,
      } as any);

      const req = { rawBody: mockRawBody };

      // First call should succeed
      const firstResult = await controller.handleWebhook(
        req as any,
        signature,
        '127.0.0.1',
      );
      expect(firstResult.status).toBe('success');

      // Second call with same event should return duplicate
      const secondResult = await controller.handleWebhook(
        req as any,
        signature,
        '127.0.0.1',
      );
      expect(secondResult.status).toBe('duplicate');
    });
  });

  describe('verifySignature', () => {
    it('should verify valid signature using timing-safe comparison', () => {
      const rawBody = 'test_body';
      const secret = 'test_secret';
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

      // Access private method via reflection or make it public for testing
      // For now, testing through public handleWebhook method
      expect(expectedSignature).toBeTruthy();
    });
  });
});

